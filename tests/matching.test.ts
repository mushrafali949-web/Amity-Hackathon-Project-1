import { describe, it, expect } from 'vitest';
import {
  evaluateNgoEligibilityAndScore,
  rankNgosForDonation,
  NgoCandidate,
} from '../src/lib/matching/engine';
import { Donation, NGO } from '../src/types/database';

describe('Matching Engine Rules & Scoring', () => {
  const baseDonation: Donation = {
    id: 'don-1',
    restaurant_id: 'rest-1',
    title: '50 Hot Meals',
    description: null,
    category: 'cooked_meal',
    diet: 'veg',
    quantity_kg: 25,
    servings: 50,
    prepared_at: new Date('2026-09-24T12:00:00Z').toISOString(),
    safe_until: new Date('2026-09-24T16:00:00Z').toISOString(), // 4h safe
    risk_score: 10,
    photo_url: null,
    status: 'posted',
    directed_ngo_id: null,
    need_id: null,
    matched_ngo_id: null,
    approx_lat: 26.9124,
    approx_lng: 75.7873,
    area_label: 'Jaipur Central',
    actual_kg_received: null,
    matched_at: null,
    picked_up_at: null,
    delivered_at: null,
    created_at: new Date('2026-09-24T12:00:00Z').toISOString(),
  };

  const eligibleNgo: NGO = {
    id: 'ngo-1',
    owner_id: 'user-1',
    name: 'Jaipur Food Rescue',
    registration_no: 'RJ123',
    contact_person: 'Director',
    phone: '9999999999',
    address: 'Civil Lines',
    city: 'Jaipur',
    lat: 26.9085, // ~1 km from restaurant
    lng: 75.792,
    service_radius_km: 15,
    daily_capacity_kg: 100,
    accepts_categories: ['cooked_meal', 'bakery'],
    accepts_diets: ['veg', 'mixed'],
    has_cold_storage: true,
    has_own_transport: true,
    open_from: '08:00:00',
    open_to: '22:00:00',
    people_served_daily: 200,
    accepting_donations: true,
    verification_status: 'verified',
    last_received_at: null,
    created_at: new Date().toISOString(),
  };

  it('approves eligible NGO and generates positive score and reasons', () => {
    const candidate: NgoCandidate = {
      ngo: eligibleNgo,
      remainingCapacityKg: 80,
    };

    const result = evaluateNgoEligibilityAndScore(
      baseDonation,
      26.9124,
      75.7873,
      candidate,
      1,
      new Date('2026-09-24T12:10:00Z')
    );

    expect(result).not.toBeNull();
    expect(result!.totalScore).toBeGreaterThan(0.6);
    expect(result!.reasons.length).toBeGreaterThan(0);
    expect(result!.distanceKm).toBeLessThan(5);
  });

  it('hard filters unverified NGOs', () => {
    const unverifiedNgo: NGO = {
      ...eligibleNgo,
      id: 'ngo-unverified',
      verification_status: 'pending',
    };

    const result = evaluateNgoEligibilityAndScore(
      baseDonation,
      26.9124,
      75.7873,
      { ngo: unverifiedNgo, remainingCapacityKg: 100 },
      1,
      new Date('2026-09-24T12:10:00Z')
    );

    expect(result).toBeNull();
  });

  it('hard filters NGOs when daily remaining capacity is smaller than quantity', () => {
    const lowCapCandidate: NgoCandidate = {
      ngo: eligibleNgo,
      remainingCapacityKg: 10, // Donation is 25 kg!
    };

    const result = evaluateNgoEligibilityAndScore(
      baseDonation,
      26.9124,
      75.7873,
      lowCapCandidate,
      1,
      new Date('2026-09-24T12:10:00Z')
    );

    expect(result).toBeNull();
  });

  it('hard filters NGOs when diet type is not accepted', () => {
    const nonVegOnlyNgo: NGO = {
      ...eligibleNgo,
      accepts_diets: ['non_veg'], // Donation is 'veg'!
    };

    const result = evaluateNgoEligibilityAndScore(
      baseDonation,
      26.9124,
      75.7873,
      { ngo: nonVegOnlyNgo, remainingCapacityKg: 100 },
      1,
      new Date('2026-09-24T12:10:00Z')
    );

    expect(result).toBeNull();
  });

  it('hard filters NGOs when distance exceeds service radius', () => {
    const farNgo: NGO = {
      ...eligibleNgo,
      lat: 28.6139, // Delhi (~240 km from Jaipur!)
      lng: 77.209,
      service_radius_km: 10,
    };

    const result = evaluateNgoEligibilityAndScore(
      baseDonation,
      26.9124,
      75.7873,
      { ngo: farNgo, remainingCapacityKg: 100 },
      1,
      new Date('2026-09-24T12:10:00Z')
    );

    expect(result).toBeNull();
  });

  it('ranks candidate NGOs by weighted score', () => {
    const closerNgo = { ...eligibleNgo, id: 'close', lat: 26.913, lng: 75.788 };
    const furtherNgo = { ...eligibleNgo, id: 'further', lat: 26.94, lng: 75.82 };

    const candidates: NgoCandidate[] = [
      { ngo: furtherNgo, remainingCapacityKg: 50 },
      { ngo: closerNgo, remainingCapacityKg: 50 },
    ];

    const ranked = rankNgosForDonation(
      baseDonation,
      26.9124,
      75.7873,
      candidates,
      1,
      new Date('2026-09-24T12:10:00Z')
    );

    expect(ranked.length).toBe(2);
    expect(ranked[0].ngo.id).toBe('close');
    expect(ranked[0].totalScore).toBeGreaterThan(ranked[1].totalScore);
  });
});
