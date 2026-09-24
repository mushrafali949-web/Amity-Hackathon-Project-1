import { createClient } from '@/lib/supabase/server';
import { NgoNeedsClient } from '@/components/ngo/NgoNeedsClient';

export default async function NgoNeedsPage() {
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

  const { data: needs } = await supabase
    .from('ngo_needs')
    .select('*')
    .eq('ngo_id', ngo.id)
    .order('created_at', { ascending: false });

  return <NgoNeedsClient ngo={ngo} initialNeeds={needs || []} />;
}
