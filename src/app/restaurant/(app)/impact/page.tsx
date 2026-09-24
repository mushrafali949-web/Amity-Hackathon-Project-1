import { createClient } from '@/lib/supabase/server';
import { aggregateDeliveredImpact } from '@/lib/impact';
import { RestaurantImpactClient } from '@/components/restaurant/RestaurantImpactClient';

export default async function RestaurantImpactPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, city')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!restaurant) return null;

  // Fetch all delivered donations for impact calculations
  const { data: deliveredDonations } = await supabase
    .from('donations')
    .select('*, ngos(name, city)')
    .eq('restaurant_id', restaurant.id)
    .eq('status', 'delivered')
    .order('delivered_at', { ascending: false });

  const stats = aggregateDeliveredImpact(deliveredDonations || []);

  return (
    <RestaurantImpactClient
      restaurant={restaurant}
      donations={deliveredDonations || []}
      stats={stats}
    />
  );
}
