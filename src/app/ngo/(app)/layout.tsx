import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { NgoSidebar } from '@/components/ngo/NgoSidebar';
import { NgoCapacityMeter } from '@/components/ngo/NgoCapacityMeter';
import {
  HeartHandshake,
  AlertTriangle,
  Building,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export default async function NgoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ngo/login');
  }

  // Fetch NGO details
  const { data: ngoData } = await supabase
    .from('ngos')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  const ngo = ngoData as import('@/types/database').NGO | null;

  // Calculate used capacity today
  let remainingCapacity = ngo?.daily_capacity_kg || 50;
  if (ngo) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: claimsData } = await supabase
      .from('donations')
      .select('quantity_kg, actual_kg_received')
      .eq('matched_ngo_id', ngo.id)
      .in('status', ['matched', 'picked_up', 'delivered'])
      .gte('matched_at', today.toISOString());

    const claims = claimsData as Array<{ quantity_kg: number; actual_kg_received: number | null }> | null;

    if (claims) {
      const usedKg = claims.reduce(
        (sum, item) => sum + (item.actual_kg_received ?? item.quantity_kg),
        0
      );
      remainingCapacity = Math.max(0, ngo.daily_capacity_kg - usedKg);
    }
  }

  const isPending = ngo?.verification_status === 'pending';

  return (
    <div className="min-h-screen bg-[#f3f9f7] text-stone-900 flex">
      {/* Persistent Left Sidebar */}
      <NgoSidebar ngo={ngo} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* NGO Top Bar */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-teal-100 h-16 flex items-center justify-between px-4 sm:px-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <span className="font-black text-sm tracking-tight text-teal-900">ResQFood</span>
            </div>

            {ngo && (
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="font-bold text-stone-900">{ngo.name}</span>
                <span className="text-stone-400">({ngo.city})</span>
                {ngo.verification_status === 'verified' ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified NGO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" /> Verification Pending
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {ngo && (
              <NgoCapacityMeter
                dailyCapacityKg={ngo.daily_capacity_kg}
                remainingCapacityKg={remainingCapacity}
                acceptingDonations={ngo.accepting_donations}
              />
            )}

            <NotificationBell userId={user.id} />
          </div>
        </header>

        {/* Pending Verification Banner */}
        {isPending && (
          <div className="bg-amber-500/10 border-b border-amber-300 px-4 py-2.5 sm:px-6 flex items-center gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="flex-1">
              <strong>Account Pending Verification:</strong> You have full access to explore the
              console, live feed, and manage team preferences. Claiming food is temporarily locked
              until verification completes. (For local demos, verify instantly in{' '}
              <Link href="/ngo/profile" className="underline font-bold">
                Profile
              </Link>
              ).
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
