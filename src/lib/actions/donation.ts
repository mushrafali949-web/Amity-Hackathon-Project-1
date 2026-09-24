'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CONFIG } from '@/lib/config';
import { validateDonationSafety } from '@/lib/safety';
import { rankNgosForDonation, NgoCandidate } from '@/lib/matching/engine';
import { notifyUser } from '@/lib/notify';
import { FoodCategory, DietType, NGO, NGONeed } from '@/types/database';

const PostDonationSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  category: z.enum([
    'cooked_meal',
    'bakery',
    'sweets',
    'dairy',
    'beverages',
    'packaged',
    'raw_produce',
  ]),
  diet: z.enum(['veg', 'non_veg', 'jain', 'mixed']),
  quantity_kg: z.number().positive('Quantity must be greater than 0'),
  servings: z.number().int().positive().optional().nullable(),
  prepared_at: z.string().datetime(),
  safe_until: z.string().datetime().optional().nullable(),
  pickup_address: z.string().min(5, 'Pickup address is required'),
  pickup_lat: z.number(),
  pickup_lng: z.number(),
  area_label: z.string().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  photo_url: z.string().optional().nullable(),
  directed_ngo_id: z.string().uuid().optional().nullable(),
  need_id: z.string().uuid().optional().nullable(),
});

export type PostDonationInput = z.infer<typeof PostDonationSchema>;

export async function postDonationAction(rawInput: PostDonationInput) {
  const parseResult = PostDonationSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues.map((i) => i.message).join(', '),
    };
  }

  const input = parseResult.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Please log in' };
  }

  // Fetch restaurant
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!restaurant) {
    return { success: false, error: 'Restaurant profile not found' };
  }

  // 1. Food Safety Validation
  const safety = validateDonationSafety(
    input.category as FoodCategory,
    input.prepared_at,
    input.safe_until
  );

  if (!safety.isValid) {
    return { success: false, error: safety.error };
  }

  // 2. Approximate coordinates (~1 km resolution for public/pre-claim feed)
  const approx_lat = Math.round(input.pickup_lat * 100) / 100;
  const approx_lng = Math.round(input.pickup_lng * 100) / 100;

  // 3. Generate 4-digit pickup OTP
  const pickup_otp = Math.floor(1000 + Math.random() * 9000).toString();

  const admin = createAdminClient();

  // 4. Insert into donations table
  const { data: donation, error: donationError } = await (admin.from('donations') as any)
    .insert({
      restaurant_id: restaurant.id,
      title: input.title,
      description: input.description || null,
      category: input.category,
      diet: input.diet,
      quantity_kg: input.quantity_kg,
      servings: input.servings || Math.round(input.quantity_kg / CONFIG.KG_PER_MEAL),
      prepared_at: input.prepared_at,
      safe_until: safety.safeUntil.toISOString(),
      risk_score: safety.riskScore,
      photo_url: input.photo_url || null,
      status: 'posted',
      directed_ngo_id: input.directed_ngo_id || null,
      need_id: input.need_id || null,
      approx_lat,
      approx_lng,
      area_label: input.area_label || `${restaurant.city} Area`,
    })
    .select('*')
    .single();

  if (donationError || !donation) {
    return { success: false, error: donationError?.message || 'Failed to create donation' };
  }

  // 5. Insert into donation_private table
  const { error: privateError } = await (admin.from('donation_private') as any).insert({
    donation_id: donation.id,
    pickup_address: input.pickup_address,
    pickup_lat: input.pickup_lat,
    pickup_lng: input.pickup_lng,
    contact_name: input.contact_name || restaurant.name,
    contact_phone: input.contact_phone || restaurant.phone,
    pickup_otp,
  });

  if (privateError) {
    console.error('Error inserting donation private details:', privateError);
  }

  // 6. Run Matching Engine (Server-side service role)
  try {
    const { data: ngos } = await admin
      .from('ngos')
      .select('*')
      .eq('verification_status', 'verified')
      .eq('accepting_donations', true);

    if (ngos && ngos.length > 0) {
      // Calculate remaining capacities for each NGO today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: claims } = await admin
        .from('donations')
        .select('matched_ngo_id, quantity_kg, actual_kg_received')
        .in('status', ['matched', 'picked_up', 'delivered'])
        .gte('matched_at', today.toISOString());

      const { data: allNeeds } = await admin
        .from('ngo_needs')
        .select('*')
        .eq('active', true);

      const candidates: NgoCandidate[] = ngos.map((ngoItem: any) => {
        const ngoClaims = (claims || []).filter((c: any) => c.matched_ngo_id === ngoItem.id);
        const usedKg = ngoClaims.reduce(
          (sum: number, c: any) => sum + (c.actual_kg_received ?? c.quantity_kg),
          0
        );
        const remainingCap = Math.max(0, ngoItem.daily_capacity_kg - usedKg);
        const ngoNeeds = (allNeeds || []).filter((n: any) => n.ngo_id === ngoItem.id);

        return {
          ngo: ngoItem as NGO,
          remainingCapacityKg: remainingCap,
          activeNeeds: ngoNeeds as NGONeed[],
        };
      });

      const matches = rankNgosForDonation(
        donation,
        input.pickup_lat,
        input.pickup_lng,
        candidates,
        1,
        new Date()
      );

      // Offer to top N eligible NGOs
      const topMatches = matches.slice(0, CONFIG.OFFER_BROADCAST_TOP_N);

      for (const match of topMatches) {
        const ttlMinutes = donation.directed_ngo_id
          ? CONFIG.DIRECTED_OFFER_TTL_MIN
          : CONFIG.OFFER_TTL_MIN;

        const maxExpiry = new Date(
          new Date(donation.safe_until).getTime() - CONFIG.HANDLING_BUFFER_MIN * 60 * 1000
        );
        let expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
        if (expiresAt.getTime() > maxExpiry.getTime()) {
          expiresAt = maxExpiry;
        }

        await (admin.from('donation_offers') as any).insert({
          donation_id: donation.id,
          ngo_id: match.ngo.id,
          score: match.totalScore,
          distance_km: match.distanceKm,
          eta_min: match.etaMin,
          status: 'pending',
          round: 1,
          expires_at: expiresAt.toISOString(),
        });

        // Notify NGO owner
        await notifyUser({
          userId: match.ngo.owner_id,
          type: 'new_offer',
          title: `New Food Offer (${donation.quantity_kg} kg)`,
          body: `${donation.title} is available nearby (${match.distanceKm} km). Claim before offer expires!`,
          link: `/ngo/console?offer=${donation.id}`,
        });
      }
    }
  } catch (matchingErr) {
    console.error('Matching engine run error:', matchingErr);
  }

  revalidatePath('/restaurant/donations');
  revalidatePath('/restaurant/dashboard');
  revalidatePath('/ngo/feed');
  revalidatePath('/ngo/console');

  return { success: true, donationId: donation.id };
}

export async function cancelDonationAction(donationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const admin = createAdminClient();

  // Verify ownership
  const { data: donation } = await admin
    .from('donations')
    .select('*, restaurants!inner(owner_id)')
    .eq('id', donationId)
    .single();

  if (!donation || (donation.restaurants as any)?.owner_id !== user.id) {
    return { success: false, error: 'Donation not found or not owned by you' };
  }

  if (donation.status !== 'posted' && donation.status !== 'matched') {
    return { success: false, error: 'Cannot cancel a donation that has already been picked up' };
  }

  await (admin.from('donations') as any)
    .update({ status: 'cancelled' })
    .eq('id', donationId);

  // If was matched, notify NGO
  if (donation.matched_ngo_id) {
    const { data: ngo } = await admin
      .from('ngos')
      .select('owner_id, name')
      .eq('id', donation.matched_ngo_id)
      .single();

    if (ngo) {
      await notifyUser({
        userId: ngo.owner_id,
        type: 'donation_cancelled',
        title: 'Donation Cancelled by Donor',
        body: `The donor has cancelled donation "${donation.title}".`,
        link: '/ngo/pickups',
      });
    }
  }

  revalidatePath(`/restaurant/donations/${donationId}`);
  revalidatePath('/restaurant/donations');
  return { success: true };
}
