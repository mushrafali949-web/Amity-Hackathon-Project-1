import { FoodCategory } from '@/types/database';

export const CONFIG = {
  KG_PER_MEAL: 0.5,
  CO2E_KG_PER_KG_FOOD: 2.5,
  AVG_SPEED_KMH: 25,
  HANDLING_BUFFER_MIN: 15,
  MIN_SAFE_WINDOW_ON_POST_MIN: 45,
  OFFER_TTL_MIN: 10,
  OFFER_BROADCAST_TOP_N: 3,
  RADIUS_WIDEN_FACTOR: 1.5,
  DIRECTED_OFFER_TTL_MIN: 15,
} as const;

export const SHELF_LIFE_HOURS: Record<FoodCategory, number> = {
  cooked_meal: 4,
  dairy: 3,
  beverages: 6,
  bakery: 12,
  sweets: 12,
  raw_produce: 24,
  packaged: 72,
};

export const MATCHING_WEIGHTS = {
  proximity: 0.4,
  capacityFit: 0.25,
  preference: 0.2,
  need: 0.1,
  fairness: 0.05,
} as const;

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  cooked_meal: 'Cooked Meals',
  bakery: 'Bakery & Bread',
  sweets: 'Sweets & Desserts',
  dairy: 'Dairy Products',
  beverages: 'Beverages',
  packaged: 'Packaged / Canned',
  raw_produce: 'Raw Produce / Veggies',
};

export const DIET_LABELS: Record<string, string> = {
  veg: 'Vegetarian',
  non_veg: 'Non-Vegetarian',
  jain: 'Jain Friendly',
  mixed: 'Mixed / Any',
};
