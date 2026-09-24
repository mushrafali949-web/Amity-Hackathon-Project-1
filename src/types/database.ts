export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'restaurant' | 'ngo';
export type FoodCategory =
  | 'cooked_meal'
  | 'bakery'
  | 'sweets'
  | 'dairy'
  | 'beverages'
  | 'packaged'
  | 'raw_produce';
export type DietType = 'veg' | 'non_veg' | 'jain' | 'mixed';
export type DonationStatus =
  | 'posted'
  | 'matched'
  | 'picked_up'
  | 'delivered'
  | 'expired'
  | 'cancelled';
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'withdrawn';
export type UrgencyLevel = 'low' | 'medium' | 'high';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  fssai_license: string | null;
  phone: string | null;
  address: string;
  city: string;
  lat: number;
  lng: number;
  default_pickup_notes: string | null;
  created_at: string;
}

export interface NGO {
  id: string;
  owner_id: string;
  name: string;
  registration_no: string | null;
  contact_person: string | null;
  phone: string | null;
  address: string;
  city: string;
  lat: number;
  lng: number;
  service_radius_km: number;
  daily_capacity_kg: number;
  accepts_categories: FoodCategory[];
  accepts_diets: DietType[];
  has_cold_storage: boolean;
  has_own_transport: boolean;
  open_from: string | null;
  open_to: string | null;
  people_served_daily: number | null;
  accepting_donations: boolean;
  verification_status: VerificationStatus;
  last_received_at: string | null;
  created_at: string;
}

export interface NGONeed {
  id: string;
  ngo_id: string;
  title: string;
  description: string | null;
  meals_needed: number;
  diet: DietType;
  urgency: UrgencyLevel;
  needed_by: string | null;
  active: boolean;
  created_at: string;
}

export interface Donation {
  id: string;
  restaurant_id: string;
  title: string;
  description: string | null;
  category: FoodCategory;
  diet: DietType;
  quantity_kg: number;
  servings: number | null;
  prepared_at: string;
  safe_until: string;
  risk_score: number;
  photo_url: string | null;
  status: DonationStatus;
  directed_ngo_id: string | null;
  need_id: string | null;
  matched_ngo_id: string | null;
  approx_lat: number;
  approx_lng: number;
  area_label: string | null;
  actual_kg_received: number | null;
  matched_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface DonationPrivate {
  donation_id: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  contact_name: string | null;
  contact_phone: string | null;
  pickup_otp: string;
}

export interface DonationOffer {
  id: string;
  donation_id: string;
  ngo_id: string;
  score: number;
  distance_km: number;
  eta_min: number;
  status: OfferStatus;
  round: number;
  expires_at: string;
  created_at: string;
}

export interface Dispatch {
  id: string;
  donation_id: string;
  token: string;
  driver_name: string | null;
  driver_phone: string | null;
  is_self_pickup: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          role: UserRole;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      restaurants: {
        Row: Restaurant;
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          fssai_license?: string | null;
          phone?: string | null;
          address: string;
          city: string;
          lat: number;
          lng: number;
          default_pickup_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          fssai_license?: string | null;
          phone?: string | null;
          address?: string;
          city?: string;
          lat?: number;
          lng?: number;
          default_pickup_notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ngos: {
        Row: NGO;
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          registration_no?: string | null;
          contact_person?: string | null;
          phone?: string | null;
          address: string;
          city: string;
          lat: number;
          lng: number;
          service_radius_km?: number;
          daily_capacity_kg?: number;
          accepts_categories?: FoodCategory[];
          accepts_diets?: DietType[];
          has_cold_storage?: boolean;
          has_own_transport?: boolean;
          open_from?: string | null;
          open_to?: string | null;
          people_served_daily?: number | null;
          accepting_donations?: boolean;
          verification_status?: VerificationStatus;
          last_received_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          registration_no?: string | null;
          contact_person?: string | null;
          phone?: string | null;
          address?: string;
          city?: string;
          lat?: number;
          lng?: number;
          service_radius_km?: number;
          daily_capacity_kg?: number;
          accepts_categories?: FoodCategory[];
          accepts_diets?: DietType[];
          has_cold_storage?: boolean;
          has_own_transport?: boolean;
          open_from?: string | null;
          open_to?: string | null;
          people_served_daily?: number | null;
          accepting_donations?: boolean;
          verification_status?: VerificationStatus;
          last_received_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ngo_needs: {
        Row: NGONeed;
        Insert: {
          id?: string;
          ngo_id: string;
          title: string;
          description?: string | null;
          meals_needed: number;
          diet?: DietType;
          urgency?: UrgencyLevel;
          needed_by?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          ngo_id?: string;
          title?: string;
          description?: string | null;
          meals_needed?: number;
          diet?: DietType;
          urgency?: UrgencyLevel;
          needed_by?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      donations: {
        Row: Donation;
        Insert: {
          id?: string;
          restaurant_id: string;
          title: string;
          description?: string | null;
          category: FoodCategory;
          diet: DietType;
          quantity_kg: number;
          servings?: number | null;
          prepared_at?: string;
          safe_until: string;
          risk_score?: number;
          photo_url?: string | null;
          status?: DonationStatus;
          directed_ngo_id?: string | null;
          need_id?: string | null;
          matched_ngo_id?: string | null;
          approx_lat: number;
          approx_lng: number;
          area_label?: string | null;
          actual_kg_received?: number | null;
          matched_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          title?: string;
          description?: string | null;
          category?: FoodCategory;
          diet?: DietType;
          quantity_kg?: number;
          servings?: number | null;
          prepared_at?: string;
          safe_until?: string;
          risk_score?: number;
          photo_url?: string | null;
          status?: DonationStatus;
          directed_ngo_id?: string | null;
          need_id?: string | null;
          matched_ngo_id?: string | null;
          approx_lat?: number;
          approx_lng?: number;
          area_label?: string | null;
          actual_kg_received?: number | null;
          matched_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      donation_private: {
        Row: DonationPrivate;
        Insert: {
          donation_id: string;
          pickup_address: string;
          pickup_lat: number;
          pickup_lng: number;
          contact_name?: string | null;
          contact_phone?: string | null;
          pickup_otp: string;
        };
        Update: {
          donation_id?: string;
          pickup_address?: string;
          pickup_lat?: number;
          pickup_lng?: number;
          contact_name?: string | null;
          contact_phone?: string | null;
          pickup_otp?: string;
        };
        Relationships: [];
      };
      donation_offers: {
        Row: DonationOffer;
        Insert: {
          id?: string;
          donation_id: string;
          ngo_id: string;
          score: number;
          distance_km: number;
          eta_min: number;
          status?: OfferStatus;
          round?: number;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          donation_id?: string;
          ngo_id?: string;
          score?: number;
          distance_km?: number;
          eta_min?: number;
          status?: OfferStatus;
          round?: number;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      dispatches: {
        Row: Dispatch;
        Insert: {
          id?: string;
          donation_id: string;
          token?: string;
          driver_name?: string | null;
          driver_phone?: string | null;
          is_self_pickup?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          donation_id?: string;
          token?: string;
          driver_name?: string | null;
          driver_phone?: string | null;
          is_self_pickup?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      ngo_public: {
        Row: {
          id: string;
          name: string;
          city: string;
          approx_lat: number;
          approx_lng: number;
          service_radius_km: number;
          daily_capacity_kg: number;
          accepts_categories: FoodCategory[];
          accepts_diets: DietType[];
          has_cold_storage: boolean;
          has_own_transport: boolean;
          open_from: string | null;
          open_to: string | null;
          verification_status: VerificationStatus;
        };
        Relationships: [];
      };
      restaurant_public: {
        Row: {
          id: string;
          name: string;
          city: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      claim_donation: {
        Args: { p_donation_id: string };
        Returns: Json;
      };
      ngo_remaining_capacity_today: {
        Args: { p_ngo_id: string };
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      food_category: FoodCategory;
      diet_type: DietType;
      donation_status: DonationStatus;
      offer_status: OfferStatus;
      urgency_level: UrgencyLevel;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
