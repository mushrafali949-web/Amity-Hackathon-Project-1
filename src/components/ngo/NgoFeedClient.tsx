'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { claimDonationAction } from '@/lib/actions/ngo';
import { DynamicNgoMap } from '@/components/map/DynamicNgoMap';
import { FOOD_CATEGORY_LABELS, DIET_LABELS } from '@/lib/config';
import { calculateDistanceKm, estimateEtaMinutes } from '@/lib/geo';
import { formatTimeAgo, formatCountdown } from '@/lib/utils';
import {
  Clock,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Filter,
  List,
  Map,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface NgoFeedClientProps {
  ngo: any;
  initialDonations: any[];
}

export function NgoFeedClient({ ngo, initialDonations }: NgoFeedClientProps) {
  const router = useRouter();
  const [donations, setDonations] = useState(initialDonations);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDiet, setSelectedDiet] = useState<string>('all');
  const [maxDistance, setMaxDistance] = useState<number>(ngo.service_radius_km || 25);
  const [sortBy, setSortBy] = useState<'match' | 'expiry'>('match');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const isVerified = ngo.verification_status === 'verified';

  // Process, score and filter donations
  const filteredDonations = donations
    .map((d) => {
      const distance = calculateDistanceKm(ngo.lat, ngo.lng, d.approx_lat, d.approx_lng);
      const eta = estimateEtaMinutes(distance);
      const countdown = formatCountdown(d.safe_until);

      // Match reasons
      const reasons: string[] = [];
      reasons.push(`${distance} km away (~${eta} min ETA)`);
      if (ngo.accepts_categories?.includes(d.category)) {
        reasons.push(`Matches your ${FOOD_CATEGORY_LABELS[d.category as keyof typeof FOOD_CATEGORY_LABELS] || d.category} preference`);
      }
      if (d.quantity_kg <= ngo.daily_capacity_kg) {
        reasons.push(`Fits daily capacity (${d.quantity_kg} kg)`);
      }

      return {
        ...d,
        distance,
        eta,
        countdown,
        reasons,
      };
    })
    .filter((d) => {
      if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
      if (selectedDiet !== 'all' && d.diet !== selectedDiet) return false;
      if (d.distance > maxDistance) return false;
      if (d.countdown.isExpired) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'expiry') {
        return new Date(a.safe_until).getTime() - new Date(b.safe_until).getTime();
      }
      // sort by distance / match
      return a.distance - b.distance;
    });

  async function handleClaim(id: string) {
    if (!isVerified) {
      toast.error('Account pending verification. You cannot claim food until verified.');
      return;
    }

    setClaimingId(id);
    try {
      const res = await claimDonationAction(id);
      if (res.success) {
        toast.success('Donation claimed! Proceed to driver dispatch.');
        router.push(`/ngo/pickups?id=${id}`);
      } else {
        toast.error(res.error || 'Failed to claim food');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred');
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Surplus Food Feed
          </h1>
          <p className="text-xs text-stone-500">
            Open broadcasts available for rescue across your service region
          </p>
        </div>

        {/* List / Map view switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-stone-200 shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'map'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" /> Map View
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-stone-500 font-bold">
          <Filter className="w-3.5 h-3.5" /> Filters:
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none"
        >
          <option value="all">All Categories</option>
          {Object.entries(FOOD_CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={selectedDiet}
          onChange={(e) => setSelectedDiet(e.target.value)}
          className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-800 font-medium focus:outline-none"
        >
          <option value="all">All Diets</option>
          {Object.entries(DIET_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 px-3 py-1 bg-stone-50 border border-stone-300 rounded-xl">
          <span className="text-stone-500 font-medium">Max Radius:</span>
          <span className="font-bold text-teal-800">{maxDistance} km</span>
          <input
            type="range"
            min={5}
            max={50}
            value={maxDistance}
            onChange={(e) => setMaxDistance(parseInt(e.target.value))}
            className="w-20 accent-teal-600 ml-1"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="ml-auto px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-800 font-bold focus:outline-none"
        >
          <option value="match">Sort: Nearest / Best Match</option>
          <option value="expiry">Sort: Expiring Soonest</option>
        </select>
      </div>

      {/* Main View: List or Map */}
      {viewMode === 'map' ? (
        <div className="h-[550px] w-full">
          <DynamicNgoMap
            ngoLat={ngo.lat}
            ngoLng={ngo.lng}
            radiusKm={ngo.service_radius_km}
            ngoName={ngo.name}
            donations={filteredDonations}
            onSelectDonation={(id: string) => handleClaim(id)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDonations.length > 0 ? (
            filteredDonations.map((d) => {
              const isHighRisk = d.risk_score >= 65;

              return (
                <div
                  key={d.id}
                  className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-semibold uppercase">
                          {d.category}
                        </span>
                        <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-semibold uppercase">
                          {d.diet}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isHighRisk
                            ? 'bg-red-100 text-red-700'
                            : d.risk_score >= 35
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {isHighRisk ? 'High Risk' : d.risk_score >= 35 ? 'Med Risk' : 'Low Risk'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-lg text-stone-900 leading-snug">{d.title}</h3>
                      <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>Approx: {d.area_label || 'Jaipur City Area'}</span>
                      </div>
                    </div>

                    {/* Weight & Servings */}
                    <div className="p-3 bg-stone-50 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-stone-500">Weight: </span>
                        <span className="font-black text-teal-800">{d.quantity_kg} kg</span>
                      </div>
                      <div className="text-stone-500">
                        ~{d.servings || Math.round(d.quantity_kg / 0.5)} meals
                      </div>
                    </div>

                    {/* Why It Matches Reasons */}
                    <div className="p-2.5 bg-teal-50/50 rounded-xl border border-teal-100 space-y-1 text-[11px] text-teal-900">
                      <div className="font-bold">Match breakdown:</div>
                      {d.reasons.map((r: string, idx: number) => (
                        <div key={idx} className="text-stone-600">
                          • {r}
                        </div>
                      ))}
                    </div>

                    {/* Safe Window Countdown Bar */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-stone-500">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-orange-500" /> Safe window:
                        </span>
                        <span className="font-bold text-orange-600">
                          {d.countdown.formatted}
                        </span>
                      </div>
                    </div>

                    {/* Note: Privacy Protected */}
                    <div className="text-[10px] text-stone-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Exact street address & donor phone revealed after
                      claim
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={claimingId === d.id || !isVerified}
                    onClick={() => handleClaim(d.id)}
                    className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs transition-transform active:scale-95 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {claimingId === d.id
                      ? 'Claiming Food...'
                      : !isVerified
                      ? 'Verification Required to Claim'
                      : 'Claim This Donation'}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-12 bg-white rounded-3xl border border-stone-200 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-800">No surplus food currently matching</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try widening your service radius or adjusting dietary filters. New restaurant surplus
                is published throughout the day.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
