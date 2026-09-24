import { createClient } from '@/lib/supabase/server';
import { aggregateDeliveredImpact } from '@/lib/impact';
import { NgoImpactClient } from '@/components/ngo/NgoImpactClient';

export default async function NgoImpactPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: ngo } = await supabase
    .from('ngos')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!ngo) return null;

  // Fetch all delivered donations received by this NGO
  const { data: deliveredDonations } = await supabase
    .from('donations')
    .select('*, restaurants(name, city, fssai_license)')
    .eq('matched_ngo_id', ngo.id)
    .eq('status', 'delivered')
    .order('delivered_at', { ascending: false });

  const stats = aggregateDeliveredImpact(deliveredDonations || []);

  return (
    <NgoImpactClient
      ngo={ngo}
      donations={deliveredDonations || []}
      stats={stats}
    />
  );
}
