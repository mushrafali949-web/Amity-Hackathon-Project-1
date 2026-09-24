import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NgoConsoleClient } from '@/components/ngo/NgoConsoleClient';

export default async function NgoConsolePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/ngo/login');

  // Fetch NGO
  const { data: ngo } = await supabase
    .from('ngos')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!ngo) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-stone-200">
        <h2 className="text-xl font-bold">Complete Your NGO Profile</h2>
        <p className="text-xs text-stone-500 mt-2">Finish setting up your team to access console.</p>
      </div>
    );
  }

  // 1. Fetch pending offers to this NGO
  const { data: offers } = await supabase
    .from('donation_offers')
    .select('*, donations(*)')
    .eq('ngo_id', ngo.id)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  // 2. Fetch active claims (matched or picked_up)
  const { data: activeClaims } = await supabase
    .from('donations')
    .select('*, donation_private(pickup_address, contact_name, contact_phone), dispatches(*)')
    .eq('matched_ngo_id', ngo.id)
    .in('status', ['matched', 'picked_up'])
    .order('matched_at', { ascending: false });

  // 3. Fetch all posted donations nearby for the map pins
  const { data: nearbyPosted } = await supabase
    .from('donations')
    .select('id, title, quantity_kg, diet, risk_score, approx_lat, approx_lng, area_label')
    .eq('status', 'posted');

  return (
    <NgoConsoleClient
      ngo={ngo}
      initialOffers={offers || []}
      initialActiveClaims={activeClaims || []}
      allPostedDonations={nearbyPosted || []}
    />
  );
}
