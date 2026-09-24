-- Supabase Schema for ResQFood
-- Real-time Surplus Food Rescue Platform

create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type user_role as enum ('restaurant', 'ngo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type food_category as enum ('cooked_meal', 'bakery', 'sweets', 'dairy', 'beverages', 'packaged', 'raw_produce');
exception when duplicate_object then null; end $$;

do $$ begin
  create type diet_type as enum ('veg', 'non_veg', 'jain', 'mixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type donation_status as enum ('posted', 'matched', 'picked_up', 'delivered', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type offer_status as enum ('pending', 'accepted', 'declined', 'expired', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type urgency_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

-- 1. Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text,
  phone text,
  created_at timestamptz default now()
);

-- 2. Restaurants
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  fssai_license text,
  phone text,
  address text not null,
  city text not null,
  lat double precision not null,
  lng double precision not null,
  default_pickup_notes text,
  created_at timestamptz default now()
);

-- 3. NGOs
create table if not exists public.ngos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  registration_no text,
  contact_person text,
  phone text,
  address text not null,
  city text not null,
  lat double precision not null,
  lng double precision not null,
  service_radius_km numeric not null default 15,
  daily_capacity_kg numeric not null default 50,
  accepts_categories food_category[] not null default '{}',
  accepts_diets diet_type[] not null default '{veg,non_veg,jain,mixed}',
  has_cold_storage boolean not null default false,
  has_own_transport boolean not null default false,
  open_from time,
  open_to time,
  people_served_daily int,
  accepting_donations boolean not null default true,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  last_received_at timestamptz,
  created_at timestamptz default now()
);

-- 4. NGO Needs
create table if not exists public.ngo_needs (
  id uuid primary key default gen_random_uuid(),
  ngo_id uuid not null references public.ngos(id) on delete cascade,
  title text not null,
  description text,
  meals_needed int not null check (meals_needed > 0),
  diet diet_type not null default 'mixed',
  urgency urgency_level not null default 'medium',
  needed_by timestamptz,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- 5. Donations
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  title text not null,
  description text,
  category food_category not null,
  diet diet_type not null,
  quantity_kg numeric not null check (quantity_kg > 0),
  servings int,
  prepared_at timestamptz not null default now(),
  safe_until timestamptz not null,
  risk_score smallint not null default 0 check (risk_score >= 0 and risk_score <= 100),
  photo_url text,
  status donation_status not null default 'posted',
  directed_ngo_id uuid references public.ngos(id),
  need_id uuid references public.ngo_needs(id),
  matched_ngo_id uuid references public.ngos(id),
  approx_lat double precision not null,
  approx_lng double precision not null,
  area_label text,
  actual_kg_received numeric,
  matched_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now(),
  check (safe_until > prepared_at)
);

-- 6. Donation Private Details
create table if not exists public.donation_private (
  donation_id uuid primary key references public.donations(id) on delete cascade,
  pickup_address text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  contact_name text,
  contact_phone text,
  pickup_otp char(4) not null
);

-- 7. Donation Offers
create table if not exists public.donation_offers (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations(id) on delete cascade,
  ngo_id uuid not null references public.ngos(id) on delete cascade,
  score numeric not null,
  distance_km numeric not null,
  eta_min int not null,
  status offer_status not null default 'pending',
  round smallint not null default 1,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  unique (donation_id, ngo_id)
);

-- 8. Dispatches
create table if not exists public.dispatches (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null unique references public.donations(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  driver_name text,
  driver_phone text,
  is_self_pickup boolean not null default false,
  created_at timestamptz default now()
);

-- 9. Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_donations_status_safe on public.donations (status, safe_until);
create index if not exists idx_donations_restaurant_created on public.donations (restaurant_id, created_at desc);
create index if not exists idx_donations_matched_ngo on public.donations (matched_ngo_id, status);
create index if not exists idx_donation_offers_lookup on public.donation_offers (ngo_id, status, expires_at);
create index if not exists idx_notifications_user_unread on public.notifications (user_id, read_at, created_at desc);
create index if not exists idx_ngo_needs_active on public.ngo_needs (ngo_id, active, created_at desc);

-- Functions & Triggers

-- Trigger on auth.users -> public.profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
begin
  if new.raw_user_meta_data->>'role' = 'restaurant' then
    v_role := 'restaurant'::user_role;
  elsif new.raw_user_meta_data->>'role' = 'ngo' then
    v_role := 'ngo'::user_role;
  else
    raise exception 'Invalid or missing user role: %', new.raw_user_meta_data->>'role';
  end if;

  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    phone = excluded.phone;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lifecycle Status Guard Trigger on donations
create or replace function public.validate_donation_status_transition()
returns trigger
language plpgsql
as $$
begin
  if old.status = new.status then
    return new;
  end if;

  if old.status = 'posted' and new.status in ('matched', 'expired', 'cancelled') then
    return new;
  end if;

  if old.status = 'matched' and new.status in ('picked_up', 'cancelled') then
    return new;
  end if;

  if old.status = 'picked_up' and new.status = 'delivered' then
    return new;
  end if;

  raise exception 'Invalid donation status transition from % to %', old.status, new.status;
end;
$$;

drop trigger if exists trg_validate_donation_status on public.donations;
create trigger trg_validate_donation_status
  before update on public.donations
  for each row execute function public.validate_donation_status_transition();

-- Remaining Capacity Helper
create or replace function public.ngo_remaining_capacity_today(p_ngo_id uuid)
returns numeric
language plpgsql
security definer
as $$
declare
  v_daily_cap numeric;
  v_used numeric;
begin
  select daily_capacity_kg into v_daily_cap from public.ngos where id = p_ngo_id;
  if not found then
    return 0;
  end if;

  select coalesce(sum(quantity_kg), 0) into v_used
  from public.donations
  where matched_ngo_id = p_ngo_id
    and status in ('matched', 'picked_up', 'delivered')
    and matched_at >= date_trunc('day', now());

  return greatest(0, v_daily_cap - v_used);
end;
$$;

-- Atomic Claim Donation RPC
create or replace function public.claim_donation(p_donation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_profile profiles%rowtype;
  v_ngo ngos%rowtype;
  v_donation donations%rowtype;
  v_remaining_capacity numeric;
  v_restaurant restaurants%rowtype;
begin
  -- 1. Verify caller profile
  select * into v_caller_profile from profiles where id = auth.uid();
  if not found or v_caller_profile.role != 'ngo' then
    raise exception 'Unauthorized: Only registered NGOs can claim donations';
  end if;

  -- 2. Verify NGO verification status and donation-accepting toggle
  select * into v_ngo from ngos where owner_id = auth.uid();
  if not found then
    raise exception 'NGO record not found for caller';
  end if;

  if v_ngo.verification_status != 'verified' then
    raise exception 'NGO account is pending verification and cannot claim donations';
  end if;

  if not v_ngo.accepting_donations then
    raise exception 'NGO is currently marked as not accepting donations';
  end if;

  -- 3. Lock donation row and check status
  select * into v_donation from donations
  where id = p_donation_id and status = 'posted'
  for update;

  if not found then
    raise exception 'Donation is no longer available or already claimed';
  end if;

  -- 4. Check time-safety window
  if v_donation.safe_until <= (now() + interval '15 minutes') then
    raise exception 'Donation has expired or is too close to expiry to safely claim';
  end if;

  -- 5. Check remaining capacity
  v_remaining_capacity := ngo_remaining_capacity_today(v_ngo.id);
  if v_remaining_capacity < v_donation.quantity_kg then
    raise exception 'Insufficient daily capacity remaining (% kg remaining, donation is % kg)',
      v_remaining_capacity, v_donation.quantity_kg;
  end if;

  -- 6. Atomically update donation
  update donations
  set
    status = 'matched',
    matched_ngo_id = v_ngo.id,
    matched_at = now()
  where id = p_donation_id and status = 'posted'
  returning * into v_donation;

  if not found then
    raise exception 'Race condition: Donation was just claimed by another organization';
  end if;

  -- 7. Update offers
  update donation_offers
  set status = 'accepted'
  where donation_id = p_donation_id and ngo_id = v_ngo.id;

  update donation_offers
  set status = 'withdrawn'
  where donation_id = p_donation_id and ngo_id != v_ngo.id and status = 'pending';

  -- 8. Fetch restaurant info for notification
  select * into v_restaurant from restaurants where id = v_donation.restaurant_id;

  -- 9. Create notifications
  insert into notifications (user_id, type, title, body, link)
  values
    (
      v_restaurant.owner_id,
      'donation_matched',
      'Donation Claimed!',
      format('%s has claimed your donation of %s (%s kg). Pickup coordination has begun.', v_ngo.name, v_donation.title, v_donation.quantity_kg),
      format('/restaurant/donations/%s', v_donation.id)
    ),
    (
      v_caller_profile.id,
      'claim_success',
      'Donation Claim Confirmed',
      format('You successfully claimed %s from %s. Assign a driver or prepare for pickup.', v_donation.title, v_restaurant.name),
      format('/ngo/pickups?id=%s', v_donation.id)
    );

  return to_jsonb(v_donation);
end;
$$;

-- Views
create or replace view public.ngo_public as
select
  id,
  name,
  city,
  round(lat::numeric, 2) as approx_lat,
  round(lng::numeric, 2) as approx_lng,
  service_radius_km,
  daily_capacity_kg,
  accepts_categories,
  accepts_diets,
  has_cold_storage,
  has_own_transport,
  open_from,
  open_to,
  verification_status
from public.ngos
where verification_status = 'verified';

create or replace view public.restaurant_public as
select
  id,
  name,
  city
from public.restaurants;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.ngos enable row level security;
alter table public.ngo_needs enable row level security;
alter table public.donations enable row level security;
alter table public.donation_private enable row level security;
alter table public.donation_offers enable row level security;
alter table public.dispatches enable row level security;
alter table public.notifications enable row level security;

-- Profiles Policies
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Restaurants Policies
create policy "Owners have full access to restaurant"
  on public.restaurants for all
  using (auth.uid() = owner_id);

create policy "NGOs can read restaurant summary"
  on public.restaurants for select
  using (auth.role() = 'authenticated');

-- NGOs Policies
create policy "Owners have full access to NGO"
  on public.ngos for all
  using (auth.uid() = owner_id);

create policy "Authenticated users can read verified NGOs"
  on public.ngos for select
  using (auth.role() = 'authenticated' and verification_status = 'verified');

-- NGO Needs Policies
create policy "NGO owner full access to needs"
  on public.ngo_needs for all
  using (
    exists (
      select 1 from public.ngos
      where ngos.id = ngo_needs.ngo_id and ngos.owner_id = auth.uid()
    )
  );

create policy "Authenticated users can read active needs"
  on public.ngo_needs for select
  using (auth.role() = 'authenticated' and active = true);

-- Donations Policies
create policy "Restaurants full access to own donations"
  on public.donations for all
  using (
    exists (
      select 1 from public.restaurants
      where restaurants.id = donations.restaurant_id and restaurants.owner_id = auth.uid()
    )
  );

create policy "NGOs can view posted donations or matched to them"
  on public.donations for select
  using (
    status = 'posted'
    or exists (
      select 1 from public.ngos
      where ngos.id = donations.matched_ngo_id and ngos.owner_id = auth.uid()
    )
  );

-- Donation Private Details Policies
create policy "Donor can view donation private details"
  on public.donation_private for select
  using (
    exists (
      select 1 from public.donations
      join public.restaurants on restaurants.id = donations.restaurant_id
      where donations.id = donation_private.donation_id
        and restaurants.owner_id = auth.uid()
    )
  );

create policy "Donor can insert donation private details"
  on public.donation_private for insert
  with check (
    exists (
      select 1 from public.donations
      join public.restaurants on restaurants.id = donations.restaurant_id
      where donations.id = donation_private.donation_id
        and restaurants.owner_id = auth.uid()
    )
  );

create policy "Claiming NGO can view private pickup details"
  on public.donation_private for select
  using (
    exists (
      select 1 from public.donations
      join public.ngos on ngos.id = donations.matched_ngo_id
      where donations.id = donation_private.donation_id
        and donations.status in ('matched', 'picked_up', 'delivered')
        and ngos.owner_id = auth.uid()
    )
  );

-- Donation Offers Policies
create policy "NGO can read own offers"
  on public.donation_offers for select
  using (
    exists (
      select 1 from public.ngos
      where ngos.id = donation_offers.ngo_id and ngos.owner_id = auth.uid()
    )
  );

create policy "Restaurant can read offer counts for own donations"
  on public.donation_offers for select
  using (
    exists (
      select 1 from public.donations
      join public.restaurants on restaurants.id = donations.restaurant_id
      where donations.id = donation_offers.donation_id
        and restaurants.owner_id = auth.uid()
    )
  );

-- Dispatches Policies
create policy "NGO owner can manage dispatches"
  on public.dispatches for all
  using (
    exists (
      select 1 from public.donations
      join public.ngos on ngos.id = donations.matched_ngo_id
      where donations.id = dispatches.donation_id
        and ngos.owner_id = auth.uid()
    )
  );

create policy "Restaurant owner can view dispatch"
  on public.dispatches for select
  using (
    exists (
      select 1 from public.donations
      join public.restaurants on restaurants.id = donations.restaurant_id
      where donations.id = dispatches.donation_id
        and restaurants.owner_id = auth.uid()
    )
  );

-- Notifications Policies
create policy "Users can view and update own notifications"
  on public.notifications for all
  using (auth.uid() = user_id);

-- Realtime Setup
do $$
begin
  alter publication supabase_realtime add table public.donations;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.donation_offers;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.ngo_needs;
exception when others then null;
end $$;
