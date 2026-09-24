import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { NotificationBell } from '@/components/shared/NotificationBell';
import {
  UtensilsCrossed,
  PlusCircle,
  Clock,
  Heart,
  BarChart3,
  User,
  LogOut,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { RestaurantNavLinks } from '@/components/restaurant/RestaurantNavLinks';
import { RestaurantMobileTabBar } from '@/components/restaurant/RestaurantMobileTabBar';

export default async function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/restaurant/login');
  }

  // Fetch restaurant details
  const { data: restaurantData } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  const restaurant = restaurantData as import('@/types/database').Restaurant | null;

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col text-stone-900 pb-20 md:pb-6">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-xs">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-16 flex items-center justify-between">
          {/* Logo & Restaurant Title */}
          <div className="flex items-center gap-3">
            <Link href="/restaurant/dashboard" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-stone-900">
                  ResQ<span className="text-orange-600">Food</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold rounded-full uppercase">
                  Donor Portal
                </span>
              </div>
            </Link>

            {restaurant && (
              <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-stone-200 text-xs text-stone-600">
                <Building className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-bold text-stone-800">{restaurant.name}</span>
                <span className="text-stone-400">({restaurant.city})</span>
                {restaurant.fssai_license && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> FSSAI Verified
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Desktop Nav Items */}
          <RestaurantNavLinks />

          {/* Action & Profile Header tools */}
          <div className="flex items-center gap-3">
            <Link
              href="/restaurant/post"
              className="hidden sm:flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" /> Post Surplus
            </Link>

            <NotificationBell userId={user.id} />

            <form action="/auth/signout" method="post" className="hidden md:block">
              <button
                type="submit"
                title="Sign out"
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-6">
        {children}
      </main>

      {/* Mobile-First Bottom Tab Bar */}
      <RestaurantMobileTabBar />
    </div>
  );
}
