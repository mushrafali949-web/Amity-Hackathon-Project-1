import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { PostDonationForm } from '@/components/restaurant/PostDonationForm';

export default async function RestaurantPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch restaurant profile
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user?.id || '')
    .maybeSingle();

  // Fetch last donation for "Repeat last donation" shortcut
  const { data: lastDonation } = await supabase
    .from('donations')
    .select('*')
    .eq('restaurant_id', restaurant?.id || '')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="max-w-2xl mx-auto py-4">
      <Suspense fallback={<div className="p-8 text-center text-sm text-stone-500">Loading donation form...</div>}>
        <PostDonationForm
          restaurant={restaurant}
          lastDonation={lastDonation}
        />
      </Suspense>
    </div>
  );
}
