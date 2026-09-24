import { describe, it, expect } from 'vitest';
import { calculateDonationImpact, aggregateDeliveredImpact } from '../src/lib/impact';

describe('Impact Metrics Calculations', () => {
  it('correctly calculates meals and CO2e from kg', () => {
    // 50 kg food / 0.5 kg per meal = 100 meals
    // 50 kg food * 2.5 kg CO2e/kg = 125 kg CO2e
    const impact = calculateDonationImpact(50);
    expect(impact.meals).toBe(100);
    expect(impact.co2eKg).toBe(125);
  });

  it('handles fractional weights accurately', () => {
    const impact = calculateDonationImpact(12.4);
    expect(impact.meals).toBe(25); // Math.round(12.4 / 0.5)
    expect(impact.co2eKg).toBe(31); // 12.4 * 2.5 = 31.0
  });

  it('aggregates delivered donations only', () => {
    const sampleDonations: any[] = [
      { id: '1', status: 'delivered', quantity_kg: 20, actual_kg_received: 18 },
      { id: '2', status: 'posted', quantity_kg: 40 },
      { id: '3', status: 'matched', quantity_kg: 10 },
      { id: '4', status: 'delivered', quantity_kg: 30, actual_kg_received: null },
      { id: '5', status: 'cancelled', quantity_kg: 15 },
    ];

    // Only #1 (18 kg) and #4 (30 kg) count = 48 kg
    const stats = aggregateDeliveredImpact(sampleDonations);
    expect(stats.completedDonationsCount).toBe(2);
    expect(stats.totalKg).toBe(48);
    expect(stats.totalMeals).toBe(96);
    expect(stats.totalCo2eKg).toBe(120);
  });
});
