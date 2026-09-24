import { createClient } from '@/lib/supabase/server';
import { NgoPickupsClient } from '@/components/ngo/NgoPickupsClient';

export default async function NgoPickupsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
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

  // Fetch claimed donations
  const { data: claimedDonations } = await supabase
    .from('donations')
    .select(
      `
      *,
      restaurants(name, phone, address, city),
      donation_private(*),
      dispatches(*)
    `
    )
    .eq('matched_ngo_id', ngo.id)
    .in('status', ['matched', 'picked_up'])
    .order('matched_at', { ascending: false });

  return (
    <NgoPickupsClient
      ngo={ngo}
      initialDonations={claimedDonations || []}
      highlightId={id}
    />
  );
}
