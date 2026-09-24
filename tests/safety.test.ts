import { describe, it, expect } from 'vitest';
import {
  calculateDefaultSafeUntil,
  calculateRiskScore,
  validateDonationSafety,
  isSafeForNGOArrival,
} from '../src/lib/safety';

describe('Food Safety Logic', () => {
  it('calculates default safe window based on category shelf life', () => {
    const now = new Date('2026-09-24T12:00:00Z');
    // cooked_meal has 4h shelf life
    const safeUntilCooked = calculateDefaultSafeUntil('cooked_meal', now);
    expect(safeUntilCooked.getTime() - now.getTime()).toBe(4 * 60 * 60 * 1000);

    // dairy has 3h shelf life
    const safeUntilDairy = calculateDefaultSafeUntil('dairy', now);
    expect(safeUntilDairy.getTime() - now.getTime()).toBe(3 * 60 * 60 * 1000);

    // raw_produce has 24h shelf life
    const safeUntilProduce = calculateDefaultSafeUntil('raw_produce', now);
    expect(safeUntilProduce.getTime() - now.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('rejects donations with safe window under 45 minutes', () => {
    const now = new Date('2026-09-24T12:00:00Z');
    // Prepared 3 hours and 30 mins ago for cooked meal (only 30 mins left)
    const preparedAt = new Date('2026-09-24T08:30:00Z');
    const result = validateDonationSafety('cooked_meal', preparedAt, null, now);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('too short');
  });

  it('accepts donations with sufficient safe window', () => {
    const now = new Date('2026-09-24T12:00:00Z');
    const preparedAt = new Date('2026-09-24T11:00:00Z'); // 3h left for cooked meal
    const result = validateDonationSafety('cooked_meal', preparedAt, null, now);

    expect(result.isValid).toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeLessThanOrEqual(100);
  });

  it('prevents donors from extending safe_until beyond category maximum', () => {
    const now = new Date('2026-09-24T12:00:00Z');
    const preparedAt = now;
    // Attempting to claim 10 hours for dairy (max is 3h)
    const customSafeUntil = new Date(now.getTime() + 10 * 60 * 60 * 1000);
    const result = validateDonationSafety('dairy', preparedAt, customSafeUntil, now);

    expect(result.safeUntil.getTime()).toBe(result.maxSafeUntil.getTime());
    expect(result.safeUntil.getTime() - preparedAt.getTime()).toBe(3 * 60 * 60 * 1000);
  });

  it('correctly checks NGO arrival time safety', () => {
    const now = new Date('2026-09-24T12:00:00Z');
    // Safe until 12:45
    const safeUntil = new Date('2026-09-24T12:45:00Z');

    // 20 min ETA + 15 min handling buffer = 35 min total arrival (12:35 <= 12:45) -> Safe
    expect(isSafeForNGOArrival(safeUntil, 20, now)).toBe(true);

    // 35 min ETA + 15 min buffer = 50 min total arrival (12:50 > 12:45) -> Unsafe
    expect(isSafeForNGOArrival(safeUntil, 35, now)).toBe(false);
  });
});
