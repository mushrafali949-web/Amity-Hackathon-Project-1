import { createClient } from '@/lib/supabase/server';
import { NgoProfileClient } from '@/components/ngo/NgoProfileClient';

export default async function NgoProfilePage() {
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

  return <NgoProfileClient ngo={ngo} />;
}
