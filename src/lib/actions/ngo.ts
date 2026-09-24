'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyUser } from '@/lib/notify';
import { FoodCategory, DietType, UrgencyLevel } from '@/types/database';

export async function claimDonationAction(donationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Please log in' };
  }

  // 1. Fetch NGO
  const { data: ngo } = await supabase
    .from('ngos')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!ngo) {
    return { success: false, error: 'NGO profile not found for this account' };
  }

  if (ngo.verification_status !== 'verified') {
    return {
      success: false,
      error: 'Your NGO account is pending verification and cannot claim food yet.',
    };
  }

  if (!ngo.accepting_donations) {
    return {
      success: false,
      error: 'You have currently paused receiving donations. Unpause in Capacity settings.',
    };
  }

  const admin = createAdminClient();

  // Try PostgreSQL RPC claim_donation first
  try {
    const { data: rpcResult, error: rpcError } = await admin.rpc('claim_donation', {
      p_donation_id: donationId,
    });

    if (!rpcError && rpcResult) {
      revalidatePath('/ngo/console');
      revalidatePath('/ngo/feed');
      revalidatePath('/ngo/pickups');
      revalidatePath(`/restaurant/donations/${donationId}`);
      return { success: true, donation: rpcResult };
    }
  } catch {
    // Fall back to atomic direct update if RPC is missing in local environment
  }

  // Atomic fallback: update donations where id = donationId and status = 'posted'
  const { data: donation, error: fetchErr } = await admin
    .from('donations')
    .select('*, restaurants!inner(owner_id, name)')
    .eq('id', donationId)
    .maybeSingle();

  if (fetchErr || !donation) {
    return { success: false, error: 'Donation not found' };
  }

  if (donation.status !== 'posted') {
    return { success: false, error: 'This donation was just claimed by another organization' };
  }

  if (new Date(donation.safe_until).getTime() <= Date.now() + 15 * 60 * 1000) {
    return { success: false, error: 'Donation is too close to safe expiry to claim safely' };
  }

  // Perform atomic update
  const { data: updatedDonation, error: updateErr } = await (admin.from('donations') as any)
    .update({
      status: 'matched',
      matched_ngo_id: ngo.id,
      matched_at: new Date().toISOString(),
    })
    .eq('id', donationId)
    .eq('status', 'posted')
    .select('*')
    .maybeSingle();

  if (updateErr || !updatedDonation) {
    return {
      success: false,
      error: 'Another organization just claimed this donation milliseconds ago.',
    };
  }

  // Mark winning offer accepted, others withdrawn
  await (admin.from('donation_offers') as any)
    .update({ status: 'accepted' })
    .eq('donation_id', donationId)
    .eq('ngo_id', ngo.id);

  await (admin.from('donation_offers') as any)
    .update({ status: 'withdrawn' })
    .eq('donation_id', donationId)
    .neq('ngo_id', ngo.id)
    .eq('status', 'pending');

  // Notify restaurant owner
  const restaurantOwnerId = (donation.restaurants as any)?.owner_id;
  if (restaurantOwnerId) {
    await notifyUser({
      userId: restaurantOwnerId,
      type: 'donation_matched',
      title: 'Donation Claimed!',
      body: `${ngo.name} has claimed your donation of ${donation.title} (${donation.quantity_kg} kg). Please prepare for pickup.`,
      link: `/restaurant/donations/${donationId}`,
    });
  }

  // Notify NGO user
  await notifyUser({
    userId: user.id,
    type: 'claim_success',
    title: 'Claim Confirmed!',
    body: `You successfully claimed ${donation.title}. Proceed to assign a driver.`,
    link: `/ngo/pickups?id=${donationId}`,
  });

  revalidatePath('/ngo/console');
  revalidatePath('/ngo/feed');
  revalidatePath('/ngo/pickups');
  revalidatePath(`/restaurant/donations/${donationId}`);

  return { success: true, donation: updatedDonation };
}

export async function assignDriverAction({
  donationId,
  driverName,
  driverPhone,
  isSelfPickup,
}: {
  donationId: string;
  driverName?: string;
  driverPhone?: string;
  isSelfPickup: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const admin = createAdminClient();

  // Create or update dispatch record
  const { data: existingDispatch } = await admin
    .from('dispatches')
    .select('id, token')
    .eq('donation_id', donationId)
    .maybeSingle();

  let token = existingDispatch?.token;

  if (existingDispatch) {
    await (admin.from('dispatches') as any)
      .update({
        driver_name: isSelfPickup ? 'NGO Volunteer Team' : driverName || null,
        driver_phone: isSelfPickup ? null : driverPhone || null,
        is_self_pickup: isSelfPickup,
      })
      .eq('id', existingDispatch.id);
  } else {
    const { data: newDispatch, error } = await (admin.from('dispatches') as any)
      .insert({
        donation_id: donationId,
        driver_name: isSelfPickup ? 'NGO Volunteer Team' : driverName || null,
        driver_phone: isSelfPickup ? null : driverPhone || null,
        is_self_pickup: isSelfPickup,
      })
      .select('token')
      .single();

    if (error || !newDispatch) {
      return { success: false, error: error?.message || 'Failed to create driver dispatch' };
    }
    token = newDispatch.token;
  }

  // Notify restaurant that driver is assigned
  const { data: donation } = await admin
    .from('donations')
    .select('*, restaurants!inner(owner_id)')
    .eq('id', donationId)
    .single();

  if (donation) {
    const rOwnerId = (donation.restaurants as any)?.owner_id;
    if (rOwnerId) {
      await notifyUser({
        userId: rOwnerId,
        type: 'driver_assigned',
        title: 'Driver Dispatched for Pickup',
        body: isSelfPickup
          ? 'The NGO team is picking up the food directly.'
          : `Driver ${driverName || 'assigned'} has been dispatched for pickup.`,
        link: `/restaurant/donations/${donationId}`,
      });
    }
  }

  revalidatePath('/ngo/pickups');
  revalidatePath(`/restaurant/donations/${donationId}`);
  return { success: true, token };
}

export async function confirmReceiptAction({
  donationId,
  actualKgReceived,
}: {
  donationId: string;
  actualKgReceived: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  if (actualKgReceived <= 0) {
    return { success: false, error: 'Actual weight received must be greater than 0' };
  }

  const admin = createAdminClient();

  const { data: donation, error: updateErr } = await (admin.from('donations') as any)
    .update({
      status: 'delivered',
      actual_kg_received: actualKgReceived,
      delivered_at: new Date().toISOString(),
    })
    .eq('id', donationId)
    .select('*, restaurants!inner(owner_id, name), ngos!inner(id, name)')
    .single();

  if (updateErr || !donation) {
    return { success: false, error: updateErr?.message || 'Failed to confirm receipt' };
  }

  // Update NGO's last_received_at timestamp
  await (admin.from('ngos') as any)
    .update({ last_received_at: new Date().toISOString() })
    .eq('id', (donation.ngos as any).id);

  // Notify restaurant of final delivery confirmation
  const rOwnerId = (donation.restaurants as any)?.owner_id;
  if (rOwnerId) {
    await notifyUser({
      userId: rOwnerId,
      type: 'donation_delivered',
      title: 'Delivery Confirmed — Food Rescued!',
      body: `${(donation.ngos as any).name} has confirmed delivery of ${actualKgReceived} kg. Your donation receipt is ready.`,
      link: `/restaurant/impact`,
    });
  }

  revalidatePath('/ngo/pickups');
  revalidatePath('/ngo/impact');
  revalidatePath(`/restaurant/donations/${donationId}`);
  revalidatePath('/restaurant/impact');
  return { success: true };
}

export async function createNgoNeedAction({
  title,
  description,
  mealsNeeded,
  diet,
  urgency,
  neededBy,
}: {
  title: string;
  description?: string;
  mealsNeeded: number;
  diet: DietType;
  urgency: UrgencyLevel;
  neededBy?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: ngo } = await supabase
    .from('ngos')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!ngo) return { success: false, error: 'NGO profile not found' };

  const admin = createAdminClient();

  const { error } = await (admin.from('ngo_needs') as any).insert({
    ngo_id: ngo.id,
    title,
    description: description || null,
    meals_needed: mealsNeeded,
    diet,
    urgency,
    needed_by: neededBy || null,
    active: true,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/ngo/needs');
  revalidatePath('/restaurant/needs');
  return { success: true };
}

export async function closeNgoNeedAction(needId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const admin = createAdminClient();
  await (admin.from('ngo_needs') as any)
    .update({ active: false })
    .eq('id', needId);

  revalidatePath('/ngo/needs');
  revalidatePath('/restaurant/needs');
  return { success: true };
}

export async function updateNgoCapacityAction({
  dailyCapacityKg,
  serviceRadiusKm,
  acceptsCategories,
  acceptsDiets,
  hasColdStorage,
  hasOwnTransport,
  openFrom,
  openTo,
  acceptingDonations,
}: {
  dailyCapacityKg: number;
  serviceRadiusKm: number;
  acceptsCategories: FoodCategory[];
  acceptsDiets: DietType[];
  hasColdStorage: boolean;
  hasOwnTransport: boolean;
  openFrom?: string;
  openTo?: string;
  acceptingDonations: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const admin = createAdminClient();
  const { error } = await (admin.from('ngos') as any)
    .update({
      daily_capacity_kg: dailyCapacityKg,
      service_radius_km: serviceRadiusKm,
      accepts_categories: acceptsCategories,
      accepts_diets: acceptsDiets,
      has_cold_storage: hasColdStorage,
      has_own_transport: hasOwnTransport,
      open_from: openFrom ? `${openFrom}:00` : null,
      open_to: openTo ? `${openTo}:00` : null,
      accepting_donations: acceptingDonations,
    })
    .eq('owner_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/ngo/capacity');
  revalidatePath('/ngo/console');
  return { success: true };
}

export async function demoVerifyNgoAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const admin = createAdminClient();
  await (admin.from('ngos') as any)
    .update({ verification_status: 'verified' })
    .eq('owner_id', user.id);

  revalidatePath('/ngo/profile');
  revalidatePath('/ngo/console');
  revalidatePath('/ngo/feed');
  return { success: true };
}
