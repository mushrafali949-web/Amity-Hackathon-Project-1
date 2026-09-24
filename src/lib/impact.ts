import { CONFIG } from './config';
import { Donation } from '@/types/database';

export interface ImpactStats {
  totalKg: number;
  totalMeals: number;
  totalCo2eKg: number;
  completedDonationsCount: number;
}

export function calculateDonationImpact(kg: number): {
  meals: number;
  co2eKg: number;
} {
  const safeKg = Math.max(0, kg);
  const meals = Math.round(safeKg / CONFIG.KG_PER_MEAL);
  const co2eKg = Math.round(safeKg * CONFIG.CO2E_KG_PER_KG_FOOD * 10) / 10;
  return { meals, co2eKg };
}

export function aggregateDeliveredImpact(donations: Array<Partial<Donation>>): ImpactStats {
  const delivered = donations.filter((d) => d.status === 'delivered');

  const totalKg = delivered.reduce((sum, d) => {
    const weight = d.actual_kg_received ?? d.quantity_kg ?? 0;
    return sum + Number(weight);
  }, 0);

  const roundedKg = Math.round(totalKg * 10) / 10;
  const { meals, co2eKg } = calculateDonationImpact(roundedKg);

  return {
    totalKg: roundedKg,
    totalMeals: meals,
    totalCo2eKg: co2eKg,
    completedDonationsCount: delivered.length,
  };
}
