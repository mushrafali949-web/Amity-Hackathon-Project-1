import { createClient } from '@/lib/supabase/server';
import { RestaurantProfileForm } from '@/components/restaurant/RestaurantProfileForm';

export default async function RestaurantProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  return (
    <div className="max-w-2xl mx-auto py-4">
      <RestaurantProfileForm restaurant={restaurant} />
    </div>
  );
}
