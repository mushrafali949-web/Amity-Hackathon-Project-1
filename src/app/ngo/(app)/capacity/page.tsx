import { createClient } from '@/lib/supabase/server';
import { NgoCapacityClient } from '@/components/ngo/NgoCapacityClient';

export default async function NgoCapacityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: ngo } = await supabase
    .from('ngos')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!ngo) return null;

  // Fetch count of currently posted donations that match this NGO's settings for the live preview
  const { data: matchingDonations } = await supabase
    .from('donations')
    .select('id, category, diet, quantity_kg')
    .eq('status', 'posted');

  return <NgoCapacityClient ngo={ngo} matchingSample={matchingDonations || []} />;
}
