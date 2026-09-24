import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DonationTrackerClient } from '@/components/restaurant/DonationTrackerClient';

export default async function RestaurantDonationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch restaurant
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!restaurant) return null;

  // Fetch donation with private details, matched NGO, dispatches, and offers count
  const { data: donation } = await supabase
    .from('donations')
    .select(
      `
      *,
      donation_private(*),
      ngos(*),
      dispatches(*),
      donation_offers(count)
    `
    )
    .eq('id', id)
    .eq('restaurant_id', restaurant.id)
    .maybeSingle();

  if (!donation) {
    notFound();
  }

  return <DonationTrackerClient initialDonation={donation} />;
}
