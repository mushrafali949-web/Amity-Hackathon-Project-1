'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { claimDonationAction, updateNgoCapacityAction } from '@/lib/actions/ngo';
import { DynamicNgoMap } from '@/components/map/DynamicNgoMap';
import { formatTimeAgo, formatCountdown } from '@/lib/utils';
import { FOOD_CATEGORY_LABELS, DIET_LABELS } from '@/lib/config';
import {
  Sparkles,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Radio,
  Truck,
  ShieldCheck,
  Power,
  RotateCw,
} from 'lucide-react';

interface NgoConsoleClientProps {
  ngo: any;
  initialOffers: any[];
  initialActiveClaims: any[];
  allPostedDonations: any[];
}

export function NgoConsoleClient({
  ngo,
  initialOffers,
  initialActiveClaims,
  allPostedDonations,
}: NgoConsoleClientProps) {
  const router = useRouter();
  const [offers, setOffers] = useState(initialOffers);
  const [activeClaims, setActiveClaims] = useState(initialActiveClaims);
  const [postedDonations, setPostedDonations] = useState(allPostedDonations);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(ngo.accepting_donations);

  // Realtime subscription for incoming offers to this NGO
  useEffect(() => {
    const supabase = createClient();

    const offerChannel = supabase
      .channel(`ngo-offers-${ngo.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donation_offers',
          filter: `ngo_id=eq.${ngo.id}`,
        },
        async (payload) => {
          toast.info('New Food Offer Received! Check your console.');
          router.refresh();
        }
      )
      .subscribe();

    const donationChannel = supabase
      .channel('ngo-donations-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations' },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(offerChannel);
      supabase.removeChannel(donationChannel);
    };
  }, [ngo.id, router]);

  async function handleClaim(donationId: string) {
    if (ngo.verification_status !== 'verified') {
      toast.error('Account pending verification. Verification is required before claiming food.');
      return;
    }

    setClaimingId(donationId);

    try {
      const res = await claimDonationAction(donationId);
      if (res.success) {
        toast.success('Food Claimed Successfully! Proceed to dispatch driver.');
        router.push(`/ngo/pickups?id=${donationId}`);
      } else {
        toast.error(res.error || 'Failed to claim donation');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error claiming donation');
    } finally {
      setClaimingId(null);
    }
  }

  async function handleToggleAccepting() {
    const nextState = !accepting;
    setAccepting(nextState);
    try {
      await updateNgoCapacityAction({
        dailyCapacityKg: ngo.daily_capacity_kg,
        serviceRadiusKm: ngo.service_radius_km,
        acceptsCategories: ngo.accepts_categories,
        acceptsDiets: ngo.accepts_diets,
        hasColdStorage: ngo.has_cold_storage,
        hasOwnTransport: ngo.has_own_transport,
        acceptingDonations: nextState,
      });
      toast.success(nextState ? 'Now accepting incoming donations' : 'Donations receiving paused');
    } catch {
      setAccepting(!nextState);
    }
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col gap-4">
      {/* 3-Panel Command Console Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* LEFT PANEL: Incoming Live Offers (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
              </span>
              <h2 className="text-sm font-black text-stone-900 tracking-tight">Incoming Offers</h2>
            </div>
            <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
              {offers.length} Live
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {offers.length > 0 ? (
              offers.map((offer: any) => {
                const donation = offer.donations;
                if (!donation) return null;
                const countdown = formatCountdown(offer.expires_at);

                return (
                  <div
                    key={offer.id}
                    className="p-4 rounded-2xl border-2 border-teal-200 bg-teal-50/40 hover:bg-teal-50/70 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-teal-800 font-bold">
                          <span className="capitalize">{donation.category}</span>
                          <span>•</span>
                          <span className="capitalize">{donation.diet}</span>
                        </div>
                        <h3 className="font-black text-sm text-stone-900 leading-snug mt-0.5">
                          {donation.title}
                        </h3>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-black text-teal-700">
                          {donation.quantity_kg} kg
                        </div>
                        <div className="text-[10px] text-stone-500">
                          ~{donation.servings || Math.round(donation.quantity_kg / 0.5)} meals
                        </div>
                      </div>
                    </div>

                    {/* Reasons / Match Breakdown */}
                    <div className="text-[11px] text-stone-600 space-y-1 bg-white p-2 rounded-xl border border-teal-100">
                      <div className="font-semibold text-teal-900">Why it matches you:</div>
                      <div className="text-[10px] text-stone-500 leading-relaxed">
                        • {offer.distance_km} km away (~{offer.eta_min} min ETA)<br />
                        • Fits remaining capacity<br />
                        • Matches {donation.diet} preference
                      </div>
                    </div>

                    {/* Expiry countdown */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-1 text-stone-500 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        <span>Offer expires:</span>
                        <strong className="text-orange-600 font-bold">{countdown.formatted}</strong>
                      </div>

                      <button
                        type="button"
                        disabled={claimingId === donation.id}
                        onClick={() => handleClaim(donation.id)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-xs shadow-md transition-transform active:scale-95 disabled:opacity-50"
                      >
                        {claimingId === donation.id ? 'Claiming...' : 'Claim Food'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center space-y-2 my-auto">
                <Radio className="w-8 h-8 text-stone-300 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-stone-700">Listening for nearby food offers</p>
                <p className="text-[11px] text-stone-400">
                  When local restaurants post surplus within your {ngo.service_radius_km} km radius,
                  instant claim invitations appear here.
                </p>
                <Link
                  href="/ngo/feed"
                  className="inline-flex text-xs font-bold text-teal-700 hover:underline pt-2"
                >
                  Or browse open Live Feed →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* CENTER PANEL: Map View (5 Cols) */}
        <div className="lg:col-span-5 h-[350px] lg:h-full rounded-3xl overflow-hidden shadow-sm">
          <DynamicNgoMap
            ngoLat={ngo.lat}
            ngoLng={ngo.lng}
            radiusKm={ngo.service_radius_km}
            ngoName={ngo.name}
            donations={postedDonations}
            onSelectDonation={(id: string) => handleClaim(id)}
          />
        </div>

        {/* RIGHT PANEL: Today Operations & Active Pickups (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
            <h2 className="text-sm font-black text-stone-900 tracking-tight">Today&apos;s Operations</h2>
            <button
              type="button"
              onClick={handleToggleAccepting}
              title="Toggle donation acceptance"
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                accepting
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span className="text-[10px]">{accepting ? 'Live' : 'Paused'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Active Pickups Overview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700">Active Pickups</span>
                <span className="text-[11px] text-teal-700 font-bold">{activeClaims.length} Active</span>
              </div>

              {activeClaims.length > 0 ? (
                <div className="space-y-2">
                  {activeClaims.map((claim: any) => (
                    <Link
                      key={claim.id}
                      href={`/ngo/pickups?id=${claim.id}`}
                      className="block p-3 rounded-2xl bg-stone-50 hover:bg-teal-50/50 border border-stone-200 text-xs transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 truncate">{claim.title}</span>
                        <span className="font-bold text-teal-700">{claim.quantity_kg} kg</span>
                      </div>
                      <div className="text-[11px] text-stone-500 truncate">
                        {claim.donation_private?.pickup_address || claim.area_label}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-200/50">
                        <span>{claim.status === 'picked_up' ? 'In Transit' : 'Needs Driver'}</span>
                        <span className="text-teal-700 font-bold">Manage Pickup →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 text-center text-[11px] text-stone-400">
                  No pickups in progress right now
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="pt-2 border-t border-stone-100 space-y-2 text-xs">
              <Link
                href="/ngo/feed"
                className="w-full py-2.5 px-3 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-xl font-bold flex items-center justify-between transition-colors border border-stone-200"
              >
                <span>Browse Full Live Feed</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>
              <Link
                href="/ngo/needs"
                className="w-full py-2.5 px-3 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-xl font-bold flex items-center justify-between transition-colors border border-stone-200"
              >
                <span>Broadcast Urgent Need</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
