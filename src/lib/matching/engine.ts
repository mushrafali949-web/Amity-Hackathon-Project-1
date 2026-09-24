import { Donation, NGO, NGONeed } from '@/types/database';
import { CONFIG, MATCHING_WEIGHTS } from '@/lib/config';
import { calculateDistanceKm, estimateEtaMinutes } from '@/lib/geo';
import { isSafeForNGOArrival } from '@/lib/safety';

export interface NgoCandidate {
  ngo: NGO;
  remainingCapacityKg: number;
  activeNeeds?: NGONeed[];
}

export interface MatchScoreBreakdown {
  proximityScore: number;
  capacityFitScore: number;
  preferenceScore: number;
  needScore: number;
  fairnessScore: number;
  totalScore: number;
}

export interface MatchResult {
  ngo: NGO;
  totalScore: number;
  distanceKm: number;
  etaMin: number;
  reasons: string[];
  breakdown: MatchScoreBreakdown;
}

export function evaluateNgoEligibilityAndScore(
  donation: Donation,
  pickupLat: number,
  pickupLng: number,
  candidate: NgoCandidate,
  round: number = 1,
  now: Date = new Date()
): MatchResult | null {
  const { ngo, remainingCapacityKg, activeNeeds = [] } = candidate;

  // 1. Verification & Active status
  if (ngo.verification_status !== 'verified') {
    return null;
  }
  if (!ngo.accepting_donations) {
    return null;
  }

  // 2. Capacity Check
  if (remainingCapacityKg < donation.quantity_kg) {
    return null;
  }

  // 3. Category Acceptance
  if (
    ngo.accepts_categories &&
    ngo.accepts_categories.length > 0 &&
    !ngo.accepts_categories.includes(donation.category)
  ) {
    return null;
  }

  // 4. Diet Acceptance
  if (
    ngo.accepts_diets &&
    ngo.accepts_diets.length > 0 &&
    !ngo.accepts_diets.includes(donation.diet) &&
    !ngo.accepts_diets.includes('mixed')
  ) {
    return null;
  }

  // 5. Distance and Radius Check (widened by round)
  const distanceKm = calculateDistanceKm(pickupLat, pickupLng, ngo.lat, ngo.lng);
  const effectiveRadius =
    round === 1
      ? ngo.service_radius_km
      : ngo.service_radius_km * Math.pow(CONFIG.RADIUS_WIDEN_FACTOR, round - 1);

  if (distanceKm > effectiveRadius) {
    return null;
  }

  // 6. ETA & Time-Safety Check
  const etaMin = estimateEtaMinutes(distanceKm);
  if (!isSafeForNGOArrival(donation.safe_until, etaMin, now)) {
    return null;
  }

  // 7. Operating Hours Check (allow if has own transport)
  if (ngo.open_to && !ngo.has_own_transport) {
    const arrivalTime = new Date(now.getTime() + etaMin * 60 * 1000);
    const [closeHour, closeMin] = ngo.open_to.split(':').map(Number);
    const closeTime = new Date(now);
    closeTime.setHours(closeHour, closeMin || 0, 0, 0);

    if (arrivalTime.getTime() > closeTime.getTime()) {
      return null;
    }
  }

  // Calculate Scores (0 to 1 each)
  const reasons: string[] = [];

  // Proximity (0..1)
  const proximityRatio = Math.max(0, 1 - distanceKm / Math.max(1, effectiveRadius));
  const proximityScore = proximityRatio;
  reasons.push(`${distanceKm} km away (~${etaMin} min ETA)`);

  // Capacity Fit (0..1)
  const capRatio = donation.quantity_kg / Math.max(donation.quantity_kg, remainingCapacityKg);
  const capacityFitScore = Math.min(1, Math.max(0.3, capRatio));
  reasons.push(`Fits daily capacity (${remainingCapacityKg} kg available)`);

  // Preference (0..1)
  let prefScore = 0.7;
  if (
    (donation.category === 'cooked_meal' || donation.category === 'dairy') &&
    ngo.has_cold_storage
  ) {
    prefScore += 0.25;
    reasons.push('Has cold storage for cooked/dairy safety');
  }
  if (ngo.accepts_diets.includes(donation.diet)) {
    prefScore += 0.05;
    reasons.push(`Matches ${donation.diet} diet preference`);
  }
  const preferenceScore = Math.min(1, prefScore);

  // Need Match (0..1)
  let needScore = 0.2;
  const matchingNeed = activeNeeds.find(
    (n) =>
      n.active &&
      (n.diet === donation.diet || n.diet === 'mixed') &&
      (!n.needed_by || new Date(n.needed_by) >= now)
  );

  if (matchingNeed) {
    needScore = matchingNeed.urgency === 'high' ? 1.0 : matchingNeed.urgency === 'medium' ? 0.75 : 0.5;
    reasons.push(`Fulfills active need: "${matchingNeed.title}"`);
  }

  // Fairness (0..1) - Boost if NGO hasn't received donations recently
  let fairnessScore = 0.5;
  if (!ngo.last_received_at) {
    fairnessScore = 1.0;
    reasons.push('High priority recipient');
  } else {
    const daysSince =
      (now.getTime() - new Date(ngo.last_received_at).getTime()) / (1000 * 60 * 60 * 24);
    fairnessScore = Math.min(1, 0.4 + daysSince * 0.1);
  }

  // Weighted Total
  const totalScore =
    proximityScore * MATCHING_WEIGHTS.proximity +
    capacityFitScore * MATCHING_WEIGHTS.capacityFit +
    preferenceScore * MATCHING_WEIGHTS.preference +
    needScore * MATCHING_WEIGHTS.need +
    fairnessScore * MATCHING_WEIGHTS.fairness;

  return {
    ngo,
    totalScore: Math.round(totalScore * 1000) / 1000,
    distanceKm,
    etaMin,
    reasons,
    breakdown: {
      proximityScore,
      capacityFitScore,
      preferenceScore,
      needScore,
      fairnessScore,
      totalScore,
    },
  };
}

/**
 * Ranks all candidate NGOs for a donation and returns sorted matches.
 */
export function rankNgosForDonation(
  donation: Donation,
  pickupLat: number,
  pickupLng: number,
  candidates: NgoCandidate[],
  round: number = 1,
  now: Date = new Date()
): MatchResult[] {
  const matches: MatchResult[] = [];

  for (const candidate of candidates) {
    // If directed to a specific NGO, only that NGO is considered in round 1
    if (round === 1 && donation.directed_ngo_id && candidate.ngo.id !== donation.directed_ngo_id) {
      continue;
    }

    const result = evaluateNgoEligibilityAndScore(
      donation,
      pickupLat,
      pickupLng,
      candidate,
      round,
      now
    );

    if (result) {
      matches.push(result);
    }
  }

  return matches.sort((a, b) => b.totalScore - a.totalScore);
}
