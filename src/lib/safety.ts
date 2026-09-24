import { FoodCategory } from '@/types/database';
import { CONFIG, SHELF_LIFE_HOURS } from './config';

export interface SafetyCheckResult {
  isValid: boolean;
  error?: string;
  maxSafeUntil: Date;
  safeUntil: Date;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const CATEGORY_RISK_MULTIPLIERS: Record<FoodCategory, number> = {
  dairy: 1.3,
  cooked_meal: 1.2,
  sweets: 1.0,
  bakery: 0.9,
  beverages: 0.8,
  raw_produce: 0.7,
  packaged: 0.5,
};

/**
 * Calculates maximum allowed safe_until for a food category and prepared_at timestamp.
 */
export function calculateDefaultSafeUntil(
  category: FoodCategory,
  preparedAt: Date = new Date()
): Date {
  const shelfHours = SHELF_LIFE_HOURS[category] || 4;
  return new Date(preparedAt.getTime() + shelfHours * 60 * 60 * 1000);
}

/**
 * Computes risk score (0-100) based on category and % of safe window elapsed.
 */
export function calculateRiskScore(
  category: FoodCategory,
  preparedAt: Date,
  safeUntil: Date,
  now: Date = new Date()
): { score: number; level: 'low' | 'medium' | 'high' } {
  const totalWindowMs = safeUntil.getTime() - preparedAt.getTime();
  const elapsedMs = Math.max(0, now.getTime() - preparedAt.getTime());

  if (totalWindowMs <= 0) {
    return { score: 100, level: 'high' };
  }

  const elapsedRatio = Math.min(1, elapsedMs / totalWindowMs);
  const baseScore = elapsedRatio * 80;
  const multiplier = CATEGORY_RISK_MULTIPLIERS[category] || 1.0;
  const score = Math.min(100, Math.max(0, Math.round(baseScore * multiplier)));

  let level: 'low' | 'medium' | 'high' = 'low';
  if (score >= 65) {
    level = 'high';
  } else if (score >= 35) {
    level = 'medium';
  }

  return { score, level };
}

/**
 * Validates a donation post against food safety rules.
 * - safe_until cannot exceed prepared_at + SHELF_LIFE_HOURS[category]
 * - safe_until - now must be >= MIN_SAFE_WINDOW_ON_POST_MIN (45 mins)
 */
export function validateDonationSafety(
  category: FoodCategory,
  preparedAtInput: Date | string,
  safeUntilInput?: Date | string | null,
  now: Date = new Date()
): SafetyCheckResult {
  const preparedAt = new Date(preparedAtInput);
  const maxSafeUntil = calculateDefaultSafeUntil(category, preparedAt);

  let safeUntil = safeUntilInput ? new Date(safeUntilInput) : maxSafeUntil;

  // Donor can only shorten safe_until, never extend beyond maximum allowable
  if (safeUntil.getTime() > maxSafeUntil.getTime()) {
    safeUntil = maxSafeUntil;
  }

  const remainingMinutes = Math.floor((safeUntil.getTime() - now.getTime()) / (60 * 1000));

  if (remainingMinutes < CONFIG.MIN_SAFE_WINDOW_ON_POST_MIN) {
    return {
      isValid: false,
      error: `Food safe window too short (${remainingMinutes} mins remaining). ResQFood requires at least ${CONFIG.MIN_SAFE_WINDOW_ON_POST_MIN} minutes safe consumption window for NGO pickup and distribution.`,
      maxSafeUntil,
      safeUntil,
      riskScore: 95,
      riskLevel: 'high',
    };
  }

  const { score, level } = calculateRiskScore(category, preparedAt, safeUntil, now);

  return {
    isValid: true,
    maxSafeUntil,
    safeUntil,
    riskScore: score,
    riskLevel: level,
  };
}

/**
 * Checks whether an NGO can safely collect and distribute the donation before expiry.
 * Condition: now + ETA + HANDLING_BUFFER_MIN <= safe_until
 */
export function isSafeForNGOArrival(
  safeUntil: Date | string,
  etaMinutes: number,
  now: Date = new Date()
): boolean {
  const safeUntilDate = new Date(safeUntil);
  const arrivalTimeMs = now.getTime() + (etaMinutes + CONFIG.HANDLING_BUFFER_MIN) * 60 * 1000;
  return arrivalTimeMs <= safeUntilDate.getTime();
}
