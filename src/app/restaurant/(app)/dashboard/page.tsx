import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { calculateDonationImpact } from '@/lib/impact';
import { FOOD_CATEGORY_LABELS, DIET_LABELS } from '@/lib/config';
import { formatTimeAgo, formatCountdown } from '@/lib/utils';
import {
  PlusCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Leaf,
  HeartHandshake,
  AlertCircle,
  Truck,
  Flame,
} from 'lucide-react';

export default async function RestaurantDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch restaurant profile
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  // If profile not yet created, redirect or show onboarder
  if (!restaurant) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-amber-900">Complete Your Kitchen Profile</h2>
        <p className="text-sm text-amber-800">
          Finish registering your address and pickup contact to start posting surplus meals.
        </p>
        <Link
          href="/restaurant/profile"
          className="inline-flex py-3 px-6 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-md"
        >
          Setup Profile
        </Link>
      </div>
    );
  }

  // 2. Fetch active donations (posted, matched, picked_up)
  const { data: activeDonations } = await supabase
    .from('donations')
    .select('*, donation_private(pickup_otp), ngos(name, phone)')
    .eq('restaurant_id', restaurant.id)
    .in('status', ['posted', 'matched', 'picked_up'])
    .order('created_at', { ascending: false });

  // 3. Fetch completed (delivered) donations for this month impact
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: deliveredDonations } = await supabase
    .from('donations')
    .select('quantity_kg, actual_kg_received, delivered_at')
    .eq('restaurant_id', restaurant.id)
    .eq('status', 'delivered')
    .gte('delivered_at', startOfMonth.toISOString());

  const totalDeliveredKg = (deliveredDonations || []).reduce((acc: number, d: any) => {
    return acc + (d.actual_kg_received ?? d.quantity_kg ?? 0);
  }, 0);

  const monthImpact = calculateDonationImpact(totalDeliveredKg);

  // 4. Fetch up to 3 urgent NGO needs in the area
  const { data: nearbyNeeds } = await supabase
    .from('ngo_needs')
    .select('*, ngos(name, city, address)')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <div className="space-y-8">
      {/* Header Greeting & Giant Post CTA Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-orange-100">
            <Sparkles className="w-3.5 h-3.5" /> Fast Surplus Rescue
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Welcome back, {restaurant.name}
          </h1>
          <p className="text-orange-100 text-sm sm:text-base leading-relaxed">
            Have surplus safe food today? Connect with verified local shelters and NGOs in under 60
            seconds before it goes to waste.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <Link
              href="/restaurant/post"
              className="inline-flex items-center gap-2.5 px-6 py-4 bg-white text-orange-600 hover:bg-orange-50 font-black rounded-2xl shadow-lg transition-transform active:scale-95 text-base"
            >
              <PlusCircle className="w-5 h-5 text-orange-600" /> Post Surplus Food Now
            </Link>
            <Link
              href="/restaurant/needs"
              className="inline-flex items-center gap-2 px-5 py-4 bg-orange-700/50 hover:bg-orange-700/70 border border-white/20 text-white font-bold rounded-2xl text-sm transition-all"
            >
              View NGO Requests <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-16 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* This Month Impact Counter */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" /> Your Impact This Month
          </h2>
          <Link
            href="/restaurant/impact"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            Full Impact & Receipts <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-stone-900">{monthImpact.meals}</div>
              <div className="text-xs text-stone-500 font-semibold">Meals Provided</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-stone-900">{totalDeliveredKg} kg</div>
              <div className="text-xs text-stone-500 font-semibold">Surplus Rescued</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-stone-900">{monthImpact.co2eKg} kg</div>
              <div className="text-xs text-stone-500 font-semibold">CO2e Emissions Diverted</div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Donations Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" /> Active Donations In Progress (
            {activeDonations?.length || 0})
          </h2>
          <Link
            href="/restaurant/donations"
            className="text-xs font-bold text-stone-600 hover:text-stone-900"
          >
            View all history
          </Link>
        </div>

        {activeDonations && activeDonations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDonations.map((item: any) => {
              const countdown = formatCountdown(item.safe_until);
              const isMatched = item.status === 'matched';
              const isPickedUp = item.status === 'picked_up';

              return (
                <div
                  key={item.id}
                  className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md space-y-4 hover:border-orange-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            isPickedUp
                              ? 'bg-blue-100 text-blue-800'
                              : isMatched
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800 animate-pulse'
                          }`}
                        >
                          {item.status === 'posted'
                            ? 'Looking for NGO'
                            : item.status === 'matched'
                            ? 'Claimed & Coordinating'
                            : 'Picked up / In Transit'}
                        </span>
                        <span className="text-xs text-stone-400">
                          {formatTimeAgo(item.created_at)}
                        </span>
                      </div>
                      <h3 className="font-black text-lg text-stone-900 mt-1">{item.title}</h3>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-orange-600">
                        {item.quantity_kg} kg
                      </div>
                      <div className="text-[11px] text-stone-500">
                        ~{item.servings || Math.round(item.quantity_kg / 0.5)} servings
                      </div>
                    </div>
                  </div>

                  {/* Safe Until Countdown */}
                  <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-2xl text-xs">
                    <Clock className="w-4 h-4 text-stone-500" />
                    <span className="text-stone-600">Safe consumption window:</span>
                    <span
                      className={`font-black ml-auto ${
                        countdown.isExpired ? 'text-red-600' : 'text-stone-900'
                      }`}
                    >
                      {countdown.formatted}
                    </span>
                  </div>

                  {/* Matched NGO & OTP Display */}
                  {isMatched && (
                    <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-900 font-bold">
                          Claimed by {item.ngos?.name || 'NGO Partner'}
                        </span>
                        <span className="text-[11px] text-emerald-700">Driver En Route</span>
                      </div>

                      {item.donation_private?.pickup_otp && (
                        <div className="flex items-center justify-between pt-1 border-t border-emerald-100">
                          <span className="text-xs text-stone-700 font-medium">
                            Pickup Handover OTP:
                          </span>
                          <span className="font-mono text-xl font-black tracking-widest text-emerald-950 bg-white px-3 py-1 rounded-lg border border-emerald-300">
                            {item.donation_private.pickup_otp}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Link
                      href={`/restaurant/donations/${item.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-orange-600 hover:text-orange-700"
                    >
                      Open Live Tracker <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 bg-white border border-stone-200 rounded-3xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-stone-800">No active donations right now</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Any meal surplus you post today will appear here in real time as nearby NGOs claim and
              dispatch drivers.
            </p>
            <Link
              href="/restaurant/post"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs"
            >
              <PlusCircle className="w-4 h-4" /> Post Food Now
            </Link>
          </div>
        )}
      </section>

      {/* Up to 3 NGOs in Need Near You */}
      {nearbyNeeds && nearbyNeeds.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-teal-600" /> NGOs In Need Near You
            </h2>
            <Link
              href="/restaurant/needs"
              className="text-xs font-bold text-stone-600 hover:text-stone-900"
            >
              See all requests
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {nearbyNeeds.map((need: any) => (
              <div
                key={need.id}
                className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                    <span className="text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      {need.ngos?.name}
                    </span>
                    <span className="text-stone-400">{need.diet}</span>
                  </div>
                  <h3 className="font-bold text-sm text-stone-900 leading-snug">{need.title}</h3>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                    Needs ~{need.meals_needed} meals ({Math.round(need.meals_needed * 0.5)} kg)
                  </p>
                </div>

                <Link
                  href={`/restaurant/post?need_id=${need.id}&directed_ngo_id=${need.ngo_id}&title=${encodeURIComponent(
                    need.title
                  )}&diet=${need.diet}&quantity=${Math.round(need.meals_needed * 0.5)}`}
                  className="w-full py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-black rounded-xl text-center transition-colors border border-orange-200"
                >
                  Donate to this NGO
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
