import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Donation } from '@/types/database';
import { FOOD_CATEGORY_LABELS, DIET_LABELS } from '@/lib/config';
import { formatTimeAgo, formatCountdown } from '@/lib/utils';
import {
  Clock,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building,
} from 'lucide-react';

export default async function RestaurantDonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!restaurant) return null;

  let query = supabase
    .from('donations')
    .select('*, ngos(name, city), donation_private(pickup_otp)')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: donations } = await query;

  const tabs = [
    { label: 'All', value: 'all' },
    { label: 'Posted', value: 'posted' },
    { label: 'Matched', value: 'matched' },
    { label: 'Picked Up', value: 'picked_up' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Donation History & Tracker
          </h1>
          <p className="text-xs text-stone-500">Track all your posted and rescued surplus meals</p>
        </div>

        <Link
          href="/restaurant/post"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4" /> Post New Food
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const active = (!status && tab.value === 'all') || status === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value === 'all' ? '/restaurant/donations' : `/restaurant/donations?status=${tab.value}`}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                active
                  ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Donation Cards Grid */}
      {donations && donations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {donations.map((item: any) => {
            const countdown = formatCountdown(item.safe_until);
            const isMatched = item.status === 'matched';
            const isDelivered = item.status === 'delivered';
            const isPickedUp = item.status === 'picked_up';

            return (
              <Link
                key={item.id}
                href={`/restaurant/donations/${item.id}`}
                className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPickedUp
                          ? 'bg-blue-100 text-blue-800'
                          : isMatched
                          ? 'bg-teal-100 text-teal-800'
                          : item.status === 'posted'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {item.status}
                    </span>

                    <span className="text-xs text-stone-400">
                      {formatTimeAgo(item.created_at)}
                    </span>
                  </div>

                  <h3 className="font-black text-lg text-stone-900 group-hover:text-orange-600 transition-colors mt-2">
                    {item.title}
                  </h3>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-semibold">
                      {FOOD_CATEGORY_LABELS[item.category as keyof typeof FOOD_CATEGORY_LABELS] || item.category}
                    </span>
                    <span className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-semibold">
                      {DIET_LABELS[item.diet] || item.diet}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-stone-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Weight & Servings:</span>
                    <span className="font-black text-stone-900">
                      {item.quantity_kg} kg (~{item.servings || Math.round(item.quantity_kg / 0.5)} meals)
                    </span>
                  </div>

                  {item.ngos && (
                    <div className="flex items-center justify-between text-teal-800 font-semibold bg-teal-50 p-2 rounded-xl">
                      <span className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-teal-600" />
                        {item.ngos.name}
                      </span>
                      {item.donation_private?.pickup_otp && isMatched && (
                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-teal-200">
                          OTP: {item.donation_private.pickup_otp}
                        </span>
                      )}
                    </div>
                  )}

                  {!isDelivered && item.status !== 'cancelled' && item.status !== 'expired' && (
                    <div className="flex items-center justify-between text-stone-500">
                      <span>Safe window:</span>
                      <span className={`font-bold ${countdown.isExpired ? 'text-red-600' : 'text-stone-800'}`}>
                        {countdown.formatted}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-end text-orange-600 font-bold group-hover:translate-x-1 transition-transform">
                    <span>View tracker</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white border border-stone-200 rounded-3xl text-center space-y-3">
          <Clock className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No donations found in this category</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Ready to share surplus food? Post today and help local shelters feed those in need.
          </p>
          <Link
            href="/restaurant/post"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs"
          >
            <PlusCircle className="w-4 h-4" /> Post Food
          </Link>
        </div>
      )}
    </div>
  );
}
