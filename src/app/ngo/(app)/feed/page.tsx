import { createClient } from '@/lib/supabase/server';
import { NgoFeedClient } from '@/components/ngo/NgoFeedClient';

export default async function NgoFeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch NGO
  const { data: ngo } = await supabase
    .from('ngos')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!ngo) return null;

  // Fetch all posted donations
  const { data: donations } = await supabase
    .from('donations')
    .select('*')
    .eq('status', 'posted')
    .gt('safe_until', new Date().toISOString())
    .order('created_at', { ascending: false });

  return <NgoFeedClient ngo={ngo} initialDonations={donations || []} />;
}
