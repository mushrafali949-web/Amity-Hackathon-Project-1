'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyUser } from '@/lib/notify';

export async function verifyDriverOtpAction({
  token,
  otp,
}: {
  token: string;
  otp: string;
}) {
  const admin = createAdminClient();

  // Find dispatch by token
  const { data: dispatch, error } = await admin
    .from('dispatches')
    .select('*, donations(*, donation_private(*), restaurants(*), ngos(*))')
    .eq('token', token)
    .maybeSingle();

  if (error || !dispatch || !dispatch.donations) {
    return { success: false, error: 'Invalid or expired dispatch token' };
  }

  const donation = dispatch.donations as any;
  const privateDetails = donation.donation_private;

  if (!privateDetails) {
    return { success: false, error: 'Donation verification record missing' };
  }

  if (privateDetails.pickup_otp.trim() !== otp.trim()) {
    return { success: false, error: 'Incorrect 4-digit handover OTP. Please verify with kitchen staff.' };
  }

  // Update donation status to picked_up
  await (admin.from('donations') as any)
    .update({
      status: 'picked_up',
      picked_up_at: new Date().toISOString(),
    })
    .eq('id', donation.id);

  // Notify restaurant owner
  const rOwnerId = donation.restaurants?.owner_id;
  if (rOwnerId) {
    await notifyUser({
      userId: rOwnerId,
      type: 'donation_picked_up',
      title: 'Food Picked Up by Driver',
      body: `Driver has confirmed OTP and picked up "${donation.title}". It is now in transit.`,
      link: `/restaurant/donations/${donation.id}`,
    });
  }

  // Notify NGO owner
  const ngoOwnerId = donation.ngos?.owner_id;
  if (ngoOwnerId) {
    await notifyUser({
      userId: ngoOwnerId,
      type: 'food_in_transit',
      title: 'Driver Has Collected Food',
      body: `Surplus food "${donation.title}" is in transit to your distribution center.`,
      link: `/ngo/pickups?id=${donation.id}`,
    });
  }

  revalidatePath(`/driver/${token}`);
  revalidatePath(`/restaurant/donations/${donation.id}`);
  revalidatePath('/ngo/pickups');

  return { success: true };
}

export async function driverMarkDeliveredAction(token: string) {
  const admin = createAdminClient();

  const { data: dispatch } = await admin
    .from('dispatches')
    .select('*, donations(*, ngos(*), restaurants(*))')
    .eq('token', token)
    .maybeSingle();

  if (!dispatch || !dispatch.donations) {
    return { success: false, error: 'Invalid dispatch token' };
  }

  const donation = dispatch.donations as any;

  // Notify NGO team that driver has arrived and delivered
  const ngoOwnerId = donation.ngos?.owner_id;
  if (ngoOwnerId) {
    await notifyUser({
      userId: ngoOwnerId,
      type: 'driver_arrived',
      title: 'Driver Arrived at Facility',
      body: `Driver reports "${donation.title}" has arrived. Please inspect and confirm actual weight received in Pickups console.`,
      link: `/ngo/pickups?id=${donation.id}`,
    });
  }

  revalidatePath(`/driver/${token}`);
  return { success: true };
}
