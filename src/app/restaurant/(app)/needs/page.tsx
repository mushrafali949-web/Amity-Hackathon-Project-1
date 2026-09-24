import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { DIET_LABELS } from '@/lib/config';
import { calculateDistanceKm } from '@/lib/geo';
import { formatTimeAgo } from '@/lib/utils';
import {
  Heart,
  AlertTriangle,
  Building,
  Clock,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export default async function RestaurantNeedsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch restaurant coords
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  // Fetch active needs from verified NGOs
  const { data: needs } = await supabase
    .from('ngo_needs')
    .select('*, ngos!inner(*)')
    .eq('active', true)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            NGO Urgent Needs Board
          </h1>
          <p className="text-xs text-stone-500">
            Local shelters and orphanages in need of fresh surplus food right now
          </p>
        </div>
      </div>

      {needs && needs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {needs.map((need: any) => {
            const ngo = need.ngos;
            let distanceKm: number | null = null;
            if (restaurant && ngo.lat && ngo.lng) {
              distanceKm = calculateDistanceKm(
                restaurant.lat,
                restaurant.lng,
                ngo.lat,
                ngo.lng
              );
            }

            const isHighUrgency = need.urgency === 'high';
            const approxKg = Math.round(need.meals_needed * 0.5);

            return (
              <div
                key={need.id}
                className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isHighUrgency
                          ? 'bg-red-100 text-red-700 animate-pulse'
                          : need.urgency === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {isHighUrgency && <Flame className="w-3 h-3 text-red-600" />}
                      Urgency: {need.urgency}
                    </span>

                    {distanceKm !== null && (
                      <span className="text-xs text-stone-500 font-semibold">
                        ~{distanceKm} km away
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-black text-base text-stone-900 leading-snug">
                      {need.title}
                    </h3>
                    {need.description && (
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                        {need.description}
                      </p>
                    )}
                  </div>

                  <div className="p-3 bg-stone-50 rounded-2xl space-y-1.5 text-xs text-stone-700">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Meals Needed:</span>
                      <span className="font-bold text-stone-900">
                        {need.meals_needed} meals (~{approxKg} kg)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Dietary:</span>
                      <span className="font-bold text-stone-900">
                        {DIET_LABELS[need.diet] || need.diet}
                      </span>
                    </div>

                    {need.needed_by && (
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 font-medium">Needed by:</span>
                        <span className="font-bold text-orange-600">
                          {new Date(need.needed_by).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* NGO Organization Summary */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <div className="truncate text-xs">
                      <p className="font-bold text-stone-800 truncate">{ngo.name}</p>
                      <p className="text-[10px] text-stone-400 truncate">{ngo.city}</p>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/restaurant/post?need_id=${need.id}&directed_ngo_id=${need.ngo_id}&title=${encodeURIComponent(
                    need.title
                  )}&diet=${need.diet}&quantity=${approxKg}`}
                  className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  Donate to this NGO <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white border border-stone-200 rounded-3xl text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No active urgent requests right now</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            When shelters or NGOs broadcast urgent food requirements, they will appear here. You can
            always post general surplus food anytime.
          </p>
          <Link
            href="/restaurant/post"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs"
          >
            Post General Surplus
          </Link>
        </div>
      )}
    </div>
  );
}
