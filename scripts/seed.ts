import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Auto-load .env.local or .env if present
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PASSWORD = 'Demo@1234';

interface RestaurantSeed {
  email: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  fssai: string;
  notes: string;
}

interface NgoSeed {
  email: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  regNo: string;
  radiusKm: number;
  capacityKg: number;
  categories: string[];
  diets: string[];
  coldStorage: boolean;
  transport: boolean;
  openFrom: string;
  openTo: string;
  peopleServed: number;
}

const RESTAURANTS: RestaurantSeed[] = [
  {
    email: 'restaurant1@demo.resqfood.app',
    name: 'Royal Spice Haveli',
    ownerName: 'Vikramaditya Rathore',
    phone: '+91 98290 11223',
    address: 'MI Road, C-Scheme, Jaipur, Rajasthan 302001',
    city: 'Jaipur',
    lat: 26.9168,
    lng: 75.8085,
    fssai: '12224026000189',
    notes: 'Rear kitchen entrance on Subhash Marg. Food packaged in insulated steel thermoware.',
  },
  {
    email: 'restaurant2@demo.resqfood.app',
    name: 'Pink City Dhaba & Bakery',
    ownerName: 'Sunita Sharma',
    phone: '+91 98291 22334',
    address: 'Tonk Road, Lal Kothi, Jaipur, Rajasthan 302015',
    city: 'Jaipur',
    lat: 26.885,
    lng: 75.8012,
    fssai: '12223026000341',
    notes: 'Call floor manager on arrival. Stackable aluminum trays prepared at 10 PM daily.',
  },
  {
    email: 'restaurant3@demo.resqfood.app',
    name: 'Jaipur Sweets & Banquet',
    ownerName: 'Manish Agarwal',
    phone: '+91 98292 33445',
    address: 'Sector 3, Malviya Nagar, Jaipur, Rajasthan 302017',
    city: 'Jaipur',
    lat: 26.8542,
    lng: 75.8155,
    fssai: '12222026000892',
    notes: 'Banquet service back exit. Clean food delivery crates provided, kindly return on next run.',
  },
  {
    email: 'restaurant4@demo.resqfood.app',
    name: 'Heritage Grand Hotel & Cafe',
    ownerName: 'Karanvir Meena',
    phone: '+91 98293 44556',
    address: 'Vaishali Nagar Main Market, Jaipur, Rajasthan 302021',
    city: 'Jaipur',
    lat: 26.9078,
    lng: 75.7431,
    fssai: '12224026001044',
    notes: 'Hotel service elevator to 1st floor kitchen dispatch zone. Security will guide.',
  },
];

const NGOS: NgoSeed[] = [
  {
    email: 'ngo1@demo.resqfood.app',
    name: 'Apna Ghar Seva Trust',
    contactPerson: 'Devendra Kothari',
    phone: '+91 94140 55667',
    address: 'Bapu Nagar, Near University, Jaipur, Rajasthan 302015',
    city: 'Jaipur',
    lat: 26.892,
    lng: 75.814,
    regNo: 'RJ-JPR-2018-0914',
    radiusKm: 15,
    capacityKg: 80,
    categories: ['cooked_meal', 'packaged', 'raw_produce', 'dairy'],
    diets: ['veg', 'mixed'],
    coldStorage: true,
    transport: true,
    openFrom: '08:00',
    openTo: '22:30',
    peopleServed: 250,
  },
  {
    email: 'ngo2@demo.resqfood.app',
    name: 'Jaipur Relief Foundation',
    contactPerson: 'Priya Chordia',
    phone: '+91 94141 66778',
    address: 'Civil Lines, Jaipur, Rajasthan 302006',
    city: 'Jaipur',
    lat: 26.906,
    lng: 75.789,
    regNo: 'RJ-JPR-2016-0422',
    radiusKm: 20,
    capacityKg: 120,
    categories: ['cooked_meal', 'bakery', 'sweets', 'dairy', 'beverages', 'packaged', 'raw_produce'],
    diets: ['veg', 'non_veg', 'jain', 'mixed'],
    coldStorage: true,
    transport: true,
    openFrom: '07:00',
    openTo: '23:00',
    peopleServed: 400,
  },
  {
    email: 'ngo3@demo.resqfood.app',
    name: 'Akshaya Seva Sansthan',
    contactPerson: 'Mohan Lal Joshi',
    phone: '+91 94142 77889',
    address: 'Mansarovar Sector 7, Jaipur, Rajasthan 302020',
    city: 'Jaipur',
    lat: 26.861,
    lng: 75.765,
    regNo: 'RJ-JPR-2019-1105',
    radiusKm: 12,
    capacityKg: 60,
    categories: ['cooked_meal', 'sweets', 'raw_produce'],
    diets: ['veg', 'jain'],
    coldStorage: false,
    transport: false,
    openFrom: '09:00',
    openTo: '20:30',
    peopleServed: 180,
  },
  {
    email: 'ngo4@demo.resqfood.app',
    name: 'Bal Sansar Child Welfare',
    contactPerson: 'Meenakshi Dave',
    phone: '+91 94143 88990',
    address: 'Adarsh Nagar, Jaipur, Rajasthan 302004',
    city: 'Jaipur',
    lat: 26.9015,
    lng: 75.832,
    regNo: 'RJ-JPR-2015-0219',
    radiusKm: 10,
    capacityKg: 45,
    categories: ['cooked_meal', 'bakery', 'dairy', 'packaged'],
    diets: ['veg', 'mixed'],
    coldStorage: true,
    transport: false,
    openFrom: '08:30',
    openTo: '21:00',
    peopleServed: 120,
  },
  {
    email: 'ngo5@demo.resqfood.app',
    name: 'Pink City Food Bank',
    contactPerson: 'Arunav Sengupta',
    phone: '+91 94144 99001',
    address: 'Sanganer Industrial Area, Jaipur, Rajasthan 302029',
    city: 'Jaipur',
    lat: 26.818,
    lng: 75.795,
    regNo: 'RJ-JPR-2020-1780',
    radiusKm: 25,
    capacityKg: 200,
    categories: ['cooked_meal', 'bakery', 'sweets', 'dairy', 'beverages', 'packaged', 'raw_produce'],
    diets: ['veg', 'non_veg', 'jain', 'mixed'],
    coldStorage: true,
    transport: true,
    openFrom: '06:00',
    openTo: '23:30',
    peopleServed: 650,
  },
  {
    email: 'ngo6@demo.resqfood.app',
    name: 'Robin Hood Volunteer Hub',
    contactPerson: 'Saurabh Jain',
    phone: '+91 94145 00112',
    address: 'Jhotwara, Jaipur, Rajasthan 302012',
    city: 'Jaipur',
    lat: 26.945,
    lng: 75.752,
    regNo: 'RJ-JPR-2021-2241',
    radiusKm: 15,
    capacityKg: 75,
    categories: ['cooked_meal', 'packaged', 'bakery'],
    diets: ['veg', 'mixed'],
    coldStorage: false,
    transport: true,
    openFrom: '10:00',
    openTo: '22:00',
    peopleServed: 200,
  },
];

async function getOrCreateUser(email: string, role: 'restaurant' | 'ngo', fullName: string, phone: string) {
  // Check if user exists in auth
  const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
  if (listError) {
    throw listError;
  }

  const existing = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  let userId = existing?.id;

  if (!existing) {
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role,
        full_name: fullName,
        phone,
      },
    });

    if (createError) {
      throw createError;
    }
    userId = created.user.id;
  }

  // Ensure profiles table has this user
  await adminClient.from('profiles').upsert(
    {
      id: userId!,
      role,
      full_name: fullName,
      phone,
    },
    { onConflict: 'id' }
  );

  return userId!;
}

async function seed() {
  console.log('🌱 Starting ResQFood Idempotent Database Seed...');

  const restaurantMap = new Map<string, string>(); // email -> restaurant_id
  const ngoMap = new Map<string, string>(); // email -> ngo_id

  // 1. Seed Restaurants
  console.log('\n[1/5] Seeding Restaurants...');
  for (const r of RESTAURANTS) {
    const userId = await getOrCreateUser(r.email, 'restaurant', r.ownerName, r.phone);

    // Upsert into restaurants
    const { data: existingRest } = await adminClient
      .from('restaurants')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    let restId = existingRest?.id;

    if (!restId) {
      const { data: inserted, error } = await adminClient
        .from('restaurants')
        .insert({
          owner_id: userId,
          name: r.name,
          fssai_license: r.fssai,
          phone: r.phone,
          address: r.address,
          city: r.city,
          lat: r.lat,
          lng: r.lng,
          default_pickup_notes: r.notes,
        })
        .select('id')
        .single();

      if (error) {
        console.error(`Error creating restaurant ${r.name}:`, error);
        continue;
      }
      restId = inserted.id;
    } else {
      await adminClient
        .from('restaurants')
        .update({
          name: r.name,
          fssai_license: r.fssai,
          phone: r.phone,
          address: r.address,
          city: r.city,
          lat: r.lat,
          lng: r.lng,
          default_pickup_notes: r.notes,
        })
        .eq('id', restId);
    }

    restaurantMap.set(r.email, restId!);
    console.log(`  ✓ Restaurant: ${r.name} (${r.email})`);
  }

  // 2. Seed NGOs
  console.log('\n[2/5] Seeding NGOs...');
  for (const n of NGOS) {
    const userId = await getOrCreateUser(n.email, 'ngo', n.contactPerson, n.phone);

    const { data: existingNgo } = await adminClient
      .from('ngos')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    let ngoId = existingNgo?.id;

    if (!ngoId) {
      const { data: inserted, error } = await adminClient
        .from('ngos')
        .insert({
          owner_id: userId,
          name: n.name,
          registration_no: n.regNo,
          contact_person: n.contactPerson,
          phone: n.phone,
          address: n.address,
          city: n.city,
          lat: n.lat,
          lng: n.lng,
          service_radius_km: n.radiusKm,
          daily_capacity_kg: n.capacityKg,
          accepts_categories: n.categories as any,
          accepts_diets: n.diets as any,
          has_cold_storage: n.coldStorage,
          has_own_transport: n.transport,
          open_from: n.openFrom,
          open_to: n.openTo,
          people_served_daily: n.peopleServed,
          accepting_donations: true,
          verification_status: 'verified',
        })
        .select('id')
        .single();

      if (error) {
        console.error(`Error creating NGO ${n.name}:`, error);
        continue;
      }
      ngoId = inserted.id;
    } else {
      await adminClient
        .from('ngos')
        .update({
          name: n.name,
          registration_no: n.regNo,
          contact_person: n.contactPerson,
          phone: n.phone,
          address: n.address,
          city: n.city,
          lat: n.lat,
          lng: n.lng,
          service_radius_km: n.radiusKm,
          daily_capacity_kg: n.capacityKg,
          accepts_categories: n.categories as any,
          accepts_diets: n.diets as any,
          has_cold_storage: n.coldStorage,
          has_own_transport: n.transport,
          open_from: n.openFrom,
          open_to: n.openTo,
          people_served_daily: n.peopleServed,
          accepting_donations: true,
          verification_status: 'verified',
        })
        .eq('id', ngoId);
    }

    ngoMap.set(n.email, ngoId!);
    console.log(`  ✓ NGO: ${n.name} (${n.email})`);
  }

  // 3. Seed Active NGO Needs
  console.log('\n[3/5] Seeding Active NGO Needs...');
  const apnaGharId = ngoMap.get('ngo1@demo.resqfood.app');
  const balSansarId = ngoMap.get('ngo4@demo.resqfood.app');
  const foodBankId = ngoMap.get('ngo5@demo.resqfood.app');

  const needsToSeed = [
    {
      ngo_id: apnaGharId!,
      title: 'Dinner Meals for 60 Night Shelter Residents',
      description: 'Urgent need for fresh vegetarian dinner meals for 60 homeless residents sheltered at our Bapu Nagar hall.',
      meals_needed: 60,
      diet: 'veg',
      urgency: 'high',
      needed_by: new Date(Date.now() + 4 * 3600000).toISOString(),
      active: true,
    },
    {
      ngo_id: balSansarId!,
      title: 'Fresh Milk & Bakery Snacks for 40 Children',
      description: 'After-school nutrition support for 40 orphan and underprivileged children.',
      meals_needed: 40,
      diet: 'veg',
      urgency: 'medium',
      needed_by: new Date(Date.now() + 6 * 3600000).toISOString(),
      active: true,
    },
    {
      ngo_id: foodBankId!,
      title: 'Cooked Rice & Dal for Community Kitchen Distribution',
      description: 'Large community feeding drive in Sanganer industrial ward. Any cooked food surplus is welcome.',
      meals_needed: 120,
      diet: 'mixed',
      urgency: 'low',
      needed_by: new Date(Date.now() + 18 * 3600000).toISOString(),
      active: true,
    },
  ];

  for (const need of needsToSeed) {
    if (!need.ngo_id) continue;
    const { data: existing } = await adminClient
      .from('ngo_needs')
      .select('id')
      .eq('ngo_id', need.ngo_id)
      .eq('title', need.title)
      .maybeSingle();

    if (!existing) {
      await adminClient.from('ngo_needs').insert(need);
      console.log(`  ✓ Need created: "${need.title}"`);
    } else {
      console.log(`  • Need already exists: "${need.title}"`);
    }
  }

  // 4. Seed Historical Delivered Donations (For rich dashboards & receipts)
  console.log('\n[4/5] Seeding Delivered Donations (For Impact Dashboards & Receipts)...');
  const rest1Id = restaurantMap.get('restaurant1@demo.resqfood.app')!;
  const rest2Id = restaurantMap.get('restaurant2@demo.resqfood.app')!;
  const rest3Id = restaurantMap.get('restaurant3@demo.resqfood.app')!;
  const rest4Id = restaurantMap.get('restaurant4@demo.resqfood.app')!;
  const ngo2Id = ngoMap.get('ngo2@demo.resqfood.app')!;
  const ngo3Id = ngoMap.get('ngo3@demo.resqfood.app')!;
  const ngo6Id = ngoMap.get('ngo6@demo.resqfood.app')!;

  const historicalDonations = [
    {
      restaurant_id: rest1Id,
      matched_ngo_id: apnaGharId,
      title: '35 kg Dal Tadka & Jeera Rice',
      description: 'Hot banquet surplus freshly packed in clean containers.',
      category: 'cooked_meal',
      diet: 'veg',
      quantity_kg: 35,
      actual_kg_received: 34.5,
      servings: 70,
      risk_score: 15,
      status: 'delivered',
      approx_lat: 26.92,
      approx_lng: 75.81,
      area_label: 'C-Scheme, Jaipur',
      prepared_at: new Date(Date.now() - 48 * 3600000).toISOString(),
      safe_until: new Date(Date.now() - 44 * 3600000).toISOString(),
      matched_at: new Date(Date.now() - 47 * 3600000).toISOString(),
      picked_up_at: new Date(Date.now() - 46 * 3600000).toISOString(),
      delivered_at: new Date(Date.now() - 45 * 3600000).toISOString(),
      otp: '7142',
      pickup_address: 'MI Road, C-Scheme, Jaipur, Rajasthan 302001',
      pickup_lat: 26.9168,
      pickup_lng: 75.8085,
    },
    {
      restaurant_id: rest2Id,
      matched_ngo_id: balSansarId,
      title: '22 kg Assorted Artisan Breads & Buns',
      description: 'Evening bakery batch surplus including dinner rolls, whole wheat loaves, and sweet buns.',
      category: 'bakery',
      diet: 'veg',
      quantity_kg: 22,
      actual_kg_received: 22,
      servings: 44,
      risk_score: 10,
      status: 'delivered',
      approx_lat: 26.89,
      approx_lng: 75.8,
      area_label: 'Lal Kothi, Jaipur',
      prepared_at: new Date(Date.now() - 72 * 3600000).toISOString(),
      safe_until: new Date(Date.now() - 60 * 3600000).toISOString(),
      matched_at: new Date(Date.now() - 71 * 3600000).toISOString(),
      picked_up_at: new Date(Date.now() - 70 * 3600000).toISOString(),
      delivered_at: new Date(Date.now() - 69 * 3600000).toISOString(),
      otp: '8821',
      pickup_address: 'Tonk Road, Lal Kothi, Jaipur, Rajasthan 302015',
      pickup_lat: 26.885,
      pickup_lng: 75.8012,
    },
    {
      restaurant_id: rest3Id,
      matched_ngo_id: ngo2Id,
      title: '40 kg Mixed Vegetable Curry & Tawa Rotis',
      description: 'Lunch event surplus kept in hot food holding cabinet.',
      category: 'cooked_meal',
      diet: 'veg',
      quantity_kg: 40,
      actual_kg_received: 40,
      servings: 80,
      risk_score: 20,
      status: 'delivered',
      approx_lat: 26.85,
      approx_lng: 75.82,
      area_label: 'Malviya Nagar, Jaipur',
      prepared_at: new Date(Date.now() - 96 * 3600000).toISOString(),
      safe_until: new Date(Date.now() - 92 * 3600000).toISOString(),
      matched_at: new Date(Date.now() - 95 * 3600000).toISOString(),
      picked_up_at: new Date(Date.now() - 94 * 3600000).toISOString(),
      delivered_at: new Date(Date.now() - 93 * 3600000).toISOString(),
      otp: '3390',
      pickup_address: 'Sector 3, Malviya Nagar, Jaipur, Rajasthan 302017',
      pickup_lat: 26.8542,
      pickup_lng: 75.8155,
    },
    {
      restaurant_id: rest3Id,
      matched_ngo_id: ngo6Id,
      title: '18 kg Gulab Jamun & Traditional Sweets',
      description: 'Festive packaging sweets, completely fresh and boxed.',
      category: 'sweets',
      diet: 'veg',
      quantity_kg: 18,
      actual_kg_received: 18,
      servings: 90,
      risk_score: 8,
      status: 'delivered',
      approx_lat: 26.85,
      approx_lng: 75.82,
      area_label: 'Malviya Nagar, Jaipur',
      prepared_at: new Date(Date.now() - 120 * 3600000).toISOString(),
      safe_until: new Date(Date.now() - 108 * 3600000).toISOString(),
      matched_at: new Date(Date.now() - 118 * 3600000).toISOString(),
      picked_up_at: new Date(Date.now() - 117 * 3600000).toISOString(),
      delivered_at: new Date(Date.now() - 116 * 3600000).toISOString(),
      otp: '4019',
      pickup_address: 'Sector 3, Malviya Nagar, Jaipur, Rajasthan 302017',
      pickup_lat: 26.8542,
      pickup_lng: 75.8155,
    },
    {
      restaurant_id: rest4Id,
      matched_ngo_id: foodBankId,
      title: '50 kg Paneer Butter Masala & Pulao',
      description: 'Buffet surplus chilled at 4°C immediately after service.',
      category: 'cooked_meal',
      diet: 'veg',
      quantity_kg: 50,
      actual_kg_received: 48,
      servings: 100,
      risk_score: 18,
      status: 'delivered',
      approx_lat: 26.91,
      approx_lng: 75.74,
      area_label: 'Vaishali Nagar, Jaipur',
      prepared_at: new Date(Date.now() - 144 * 3600000).toISOString(),
      safe_until: new Date(Date.now() - 140 * 3600000).toISOString(),
      matched_at: new Date(Date.now() - 143 * 3600000).toISOString(),
      picked_up_at: new Date(Date.now() - 142 * 3600000).toISOString(),
      delivered_at: new Date(Date.now() - 141 * 3600000).toISOString(),
      otp: '5562',
      pickup_address: 'Vaishali Nagar Main Market, Jaipur, Rajasthan 302021',
      pickup_lat: 26.9078,
      pickup_lng: 75.7431,
    },
    {
      restaurant_id: rest4Id,
      matched_ngo_id: ngo3Id,
      title: '28 kg Fresh Packed Sandwiches & Wraps',
      description: 'Cafe showcase surplus, individually sealed with vegetarian labels.',
      category: 'packaged',
      diet: 'jain',
      quantity_kg: 28,
      actual_kg_received: 28,
      servings: 56,
      risk_score: 5,
      status: 'delivered',
      approx_lat: 26.91,
      approx_lng: 75.74,
      area_label: 'Vaishali Nagar, Jaipur',
      prepared_at: new Date(Date.now() - 168 * 3600000).toISOString(),
      safe_until: new Date(Date.now() - 96 * 3600000).toISOString(),
      matched_at: new Date(Date.now() - 167 * 3600000).toISOString(),
      picked_up_at: new Date(Date.now() - 166 * 3600000).toISOString(),
      delivered_at: new Date(Date.now() - 165 * 3600000).toISOString(),
      otp: '9920',
      pickup_address: 'Vaishali Nagar Main Market, Jaipur, Rajasthan 302021',
      pickup_lat: 26.9078,
      pickup_lng: 75.7431,
    },
  ];

  for (const d of historicalDonations) {
    const { data: existing } = await adminClient
      .from('donations')
      .select('id')
      .eq('restaurant_id', d.restaurant_id)
      .eq('title', d.title)
      .maybeSingle();

    if (!existing) {
      const { data: insertedDonation, error } = await adminClient
        .from('donations')
        .insert({
          restaurant_id: d.restaurant_id,
          matched_ngo_id: d.matched_ngo_id,
          title: d.title,
          description: d.description,
          category: d.category as any,
          diet: d.diet as any,
          quantity_kg: d.quantity_kg,
          actual_kg_received: d.actual_kg_received,
          servings: d.servings,
          risk_score: d.risk_score,
          status: 'delivered',
          approx_lat: d.approx_lat,
          approx_lng: d.approx_lng,
          area_label: d.area_label,
          prepared_at: d.prepared_at,
          safe_until: d.safe_until,
          matched_at: d.matched_at,
          picked_up_at: d.picked_up_at,
          delivered_at: d.delivered_at,
        })
        .select('id')
        .single();

      if (!error && insertedDonation) {
        await adminClient.from('donation_private').insert({
          donation_id: insertedDonation.id,
          pickup_address: d.pickup_address,
          pickup_lat: d.pickup_lat,
          pickup_lng: d.pickup_lng,
          contact_name: 'Duty Manager',
          contact_phone: '+91 98290 00000',
          pickup_otp: d.otp,
        });
      }
      console.log(`  ✓ Delivered Donation: "${d.title}" (${d.actual_kg_received} kg)`);
    } else {
      console.log(`  • Donation already exists: "${d.title}"`);
    }
  }

  // 5. Seed 1 Active "POSTED" and 1 Active "MATCHED" with Driver Dispatch for Live Demo
  console.log('\n[5/5] Seeding Active Donations for Live Demonstration...');
  const activePostedTitle = '15 kg Fresh Pav & Dinner Rolls';
  const { data: existingActivePosted } = await adminClient
    .from('donations')
    .select('id')
    .eq('restaurant_id', rest2Id)
    .eq('title', activePostedTitle)
    .maybeSingle();

  if (!existingActivePosted) {
    const { data: insertedActive, error } = await adminClient
      .from('donations')
      .insert({
        restaurant_id: rest2Id,
        title: activePostedTitle,
        description: 'Freshly baked pav buns, ready in boxes for dinner soup kitchen distribution.',
        category: 'bakery',
        diet: 'veg',
        quantity_kg: 15,
        servings: 30,
        risk_score: 12,
        status: 'posted',
        approx_lat: 26.89,
        approx_lng: 75.8,
        area_label: 'Lal Kothi, Jaipur',
        prepared_at: new Date(Date.now() - 30 * 60000).toISOString(),
        safe_until: new Date(Date.now() + 5 * 3600000).toISOString(),
      })
      .select('id')
      .single();

    if (!error && insertedActive) {
      await adminClient.from('donation_private').insert({
        donation_id: insertedActive.id,
        pickup_address: 'Tonk Road, Lal Kothi, Jaipur, Rajasthan 302015',
        pickup_lat: 26.885,
        pickup_lng: 75.8012,
        contact_name: 'Sunita Sharma',
        contact_phone: '+91 98291 22334',
        pickup_otp: '6249',
      });
      console.log(`  ✓ Active POSTED Donation created: "${activePostedTitle}"`);
    }
  }

  // Active Matched with Dispatch
  const activeMatchedTitle = '25 kg Fresh Vegetable Biryani';
  const { data: existingActiveMatched } = await adminClient
    .from('donations')
    .select('id')
    .eq('restaurant_id', rest1Id)
    .eq('title', activeMatchedTitle)
    .maybeSingle();

  let demoDispatchToken = '';
  if (!existingActiveMatched) {
    const { data: insertedMatched, error } = await adminClient
      .from('donations')
      .insert({
        restaurant_id: rest1Id,
        matched_ngo_id: apnaGharId,
        title: activeMatchedTitle,
        description: 'Steaming hot aromatic vegetable biryani prepared for corporate banquet, untouched.',
        category: 'cooked_meal',
        diet: 'veg',
        quantity_kg: 25,
        servings: 50,
        risk_score: 18,
        status: 'matched',
        approx_lat: 26.92,
        approx_lng: 75.81,
        area_label: 'C-Scheme, Jaipur',
        prepared_at: new Date(Date.now() - 45 * 60000).toISOString(),
        safe_until: new Date(Date.now() + 3 * 3600000).toISOString(),
        matched_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (!error && insertedMatched) {
      await adminClient.from('donation_private').insert({
        donation_id: insertedMatched.id,
        pickup_address: 'MI Road, C-Scheme, Jaipur, Rajasthan 302001',
        pickup_lat: 26.9168,
        pickup_lng: 75.8085,
        contact_name: 'Vikramaditya Rathore',
        contact_phone: '+91 98290 11223',
        pickup_otp: '4829',
      });

      // Create dispatch with driver
      const { data: dispatch } = await adminClient
        .from('dispatches')
        .insert({
          donation_id: insertedMatched.id,
          driver_name: 'Ramesh Kumar (Volunteer)',
          driver_phone: '+91 98299 88776',
          is_self_pickup: false,
        })
        .select('token')
        .single();

      demoDispatchToken = dispatch?.token || '';
      console.log(`  ✓ Active MATCHED Donation with Driver Dispatch created: "${activeMatchedTitle}"`);
    }
  }

  console.log('\n=============================================================');
  console.log('🎉 RESQFOOD DEMO DATABASE SEEDED SUCCESSFULLY!');
  console.log('=============================================================');
  console.log('\n🔑 DEMO RESTAURANT CREDENTIALS (Warm Amber Mobile Portal):');
  console.log('  1. Royal Spice Haveli (C-Scheme):');
  console.log('     Email:    restaurant1@demo.resqfood.app');
  console.log(`     Password: ${DEFAULT_PASSWORD}`);
  console.log('  2. Pink City Dhaba & Bakery (Lal Kothi):');
  console.log('     Email:    restaurant2@demo.resqfood.app');
  console.log(`     Password: ${DEFAULT_PASSWORD}`);
  console.log('\n🔑 DEMO NGO CREDENTIALS (Calm Teal Operations Console):');
  console.log('  1. Apna Ghar Seva Trust (Bapu Nagar):');
  console.log('     Email:    ngo1@demo.resqfood.app');
  console.log(`     Password: ${DEFAULT_PASSWORD}`);
  console.log('  2. Jaipur Relief Foundation (Civil Lines):');
  console.log('     Email:    ngo2@demo.resqfood.app');
  console.log(`     Password: ${DEFAULT_PASSWORD}`);
  console.log('  3. Bal Sansar Child Welfare (Adarsh Nagar):');
  console.log('     Email:    ngo4@demo.resqfood.app');
  console.log(`     Password: ${DEFAULT_PASSWORD}`);

  if (demoDispatchToken) {
    console.log('\n🚚 LIVE DRIVER DISPATCH URL (No login needed):');
    console.log(`  http://localhost:3000/driver/${demoDispatchToken}`);
    console.log('  Physical Handover OTP for this pickup: 4829');
  }
  console.log('=============================================================\n');
}

seed().catch((err) => {
  console.error('❌ Seed Script Failed:', err);
  process.exit(1);
});
