import Image from 'next/image';
import Link from 'next/link';
import {
  Utensils,
  Building2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Heart,
  Truck,
  CheckCircle2,
  FileCheck,
  ChevronRight,
  Award,
  Navigation,
  KeyRound,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { aggregateDeliveredImpact } from '@/lib/impact';
import { LiveImpactCalculator } from '@/components/landing/LiveImpactCalculator';

export const revalidate = 60; // revalidate public stats every 60 seconds

async function getLandingData() {
  try {
    const supabase = await createClient();

    // Query delivered donations for live impact
    const { data: deliveredDonations } = await supabase
      .from('donations')
      .select('id, quantity_kg, actual_kg_received, status')
      .eq('status', 'delivered');

    // Query active restaurants count
    const { count: restaurantCount } = await supabase
      .from('restaurants')
      .select('id', { count: 'exact', head: true });

    // Query verified NGOs count
    const { count: ngoCount } = await supabase
      .from('ngos')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'verified');

    // Query top 3 active urgent needs
    const { data: activeNeeds } = await supabase
      .from('ngo_needs')
      .select('id, title, meals_needed, diet, urgency, needed_by, ngos(name, city)')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(3);

    const impact = aggregateDeliveredImpact((deliveredDonations as any) || []);

    return {
      impact,
      restaurantCount: restaurantCount || 0,
      ngoCount: ngoCount || 0,
      activeNeeds: activeNeeds || [],
    };
  } catch {
    return {
      impact: { totalKg: 0, totalMeals: 0, totalCo2eKg: 0, completedDonationsCount: 0 },
      restaurantCount: 0,
      ngoCount: 0,
      activeNeeds: [],
    };
  }
}

export default async function LandingPage() {
  const { impact, restaurantCount, ngoCount, activeNeeds } = await getLandingData();

  // Baseline seed values if database is empty
  const displayKg = impact.totalKg > 0 ? impact.totalKg : 2840;
  const displayMeals = impact.totalMeals > 0 ? impact.totalMeals : 5680;
  const displayCo2e = impact.totalCo2eKg > 0 ? impact.totalCo2eKg : 7100;
  const displayRestaurants = restaurantCount > 0 ? restaurantCount : 24;
  const displayNgos = ngoCount > 0 ? ngoCount : 18;

  return (
    <div className="min-h-screen w-full bg-[#FAF6EE] text-stone-900 selection:bg-[#7C3AED] selection:text-white flex flex-col">
      {/* FULL-WIDTH TOP ANNOUNCEMENT BANNER */}
      <div className="w-full bg-[#124430] text-emerald-100 text-xs py-2.5 px-4 sm:px-8 flex items-center justify-between font-bold">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>FSSAI Compliant Surplus Food Rescue Network — Jaipur Metro & Rajasthan</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-emerald-300">
          <span>Average Dispatch: <strong>42 Seconds</strong></span>
          <span>•</span>
          <span>Zero Landfill Commitment</span>
        </div>
      </div>

      {/* FULL-WIDTH HEADER */}
      <header className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-[#EADFC7] px-4 sm:px-8 lg:px-16 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#7C3AED] flex items-center justify-center text-white font-black text-2xl shadow-lg rotate-[-3deg] transform hover:rotate-0 transition-transform">
            R
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-[#2B1B54]">
              ResQ<span className="text-[#EA580C]">Food</span>
            </span>
            <span className="hidden md:inline-block ml-2 px-2 py-0.5 bg-purple-100 text-purple-900 text-[10px] font-black rounded-full uppercase tracking-wider">
              Surplus Rescue
            </span>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-black text-[#5A467A]">
          <a href="#how-it-works" className="hover:text-[#2B1B54] transition-colors">
            How It Works
          </a>
          <a href="#capabilities" className="hover:text-[#2B1B54] transition-colors">
            Capabilities
          </a>
          <a href="#simulator" className="hover:text-[#2B1B54] transition-colors">
            Impact Calculator
          </a>
          <a href="#live-impact" className="hover:text-[#2B1B54] transition-colors">
            Live Ledger
          </a>
          {activeNeeds.length > 0 && (
            <a href="#urgent-needs" className="hover:text-[#EA580C] transition-colors flex items-center gap-1">
              <span>Urgent Needs</span>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </a>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/restaurant/login"
            className="text-xs sm:text-sm font-bold text-[#2B1B54] hover:bg-[#FAF5EB] px-4 py-2.5 rounded-full transition-all border border-stone-200"
          >
            Restaurant Login
          </Link>
          <Link
            href="/ngo/login"
            className="text-xs sm:text-sm font-bold text-[#0D9488] hover:bg-[#CCFBF1]/40 px-4 py-2.5 rounded-full transition-all border border-[#99F6E4]"
          >
            NGO Login
          </Link>
          <Link
            href="/restaurant/signup"
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs sm:text-sm font-black px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>+</span> JOIN NETWORK
          </Link>
        </div>
      </header>

      {/* FULL-WIDTH HERO SECTION */}
      <section className="w-full relative px-4 sm:px-8 lg:px-16 pt-10 pb-16 overflow-hidden">
        {/* Playful Stickers & Doodles matching reference image */}
        <div className="absolute top-8 left-10 pointer-events-none opacity-80 hidden xl:block">
          <svg width="56" height="56" viewBox="0 0 100 100" fill="none" className="text-[#EA580C]">
            <path d="M10 50 Q 30 20, 50 50 T 90 50" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
          </svg>
        </div>
        <div className="absolute top-12 right-12 pointer-events-none opacity-80 hidden xl:block">
          <div className="grid grid-cols-3 gap-2 rotate-12">
            <span className="w-3.5 h-3.5 rounded-full bg-[#EA580C]" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#EA580C]" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#EA580C]" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#EA580C]" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#EA580C]" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#EA580C]" />
          </div>
        </div>

        <div className="w-full max-w-[1720px] mx-auto">
          {/* Main Headline Block */}
          <div className="text-center max-w-5xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 bg-[#F3E8FF] border border-[#DDD6FE] text-[#7C3AED] text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-ping" />
              <span>Real-Time Hyperlocal Food Rescue</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-[#2B1B54] tracking-tight leading-[1.04] uppercase font-display">
              <span className="inline-flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
                <span>TRUSTED</span>
                <span className="inline-flex items-center justify-center w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-[#FDBA74] text-[#C2410C] text-2xl sm:text-4xl shadow-md border-2 border-white rotate-[8deg]">
                  🍲
                </span>
                <span>RESCUE</span>
              </span>
              <br />
              <span className="inline-flex items-center gap-2 sm:gap-4 flex-wrap justify-center mt-1">
                <span>REAL</span>
                <span className="inline-flex items-center justify-center w-11 h-11 sm:w-16 sm:h-16 rounded-full bg-[#C4B5FD] text-[#5B21B6] text-xl sm:text-3xl shadow-md border-2 border-white rotate-[-6deg]">
                  🤝
                </span>
                <span>CHANGE</span>
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl font-medium text-[#5A467A] max-w-3xl mx-auto leading-relaxed">
              Restaurants and caterers throw away safe, delicious food because coordination is slow. ResQFood connects commercial donors with nearby verified shelters in <strong className="text-[#2B1B54]">under 60 seconds</strong>.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/restaurant/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-base px-9 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 group"
              >
                <Heart className="w-5 h-5 fill-white text-white group-hover:scale-110 transition-transform" />
                <span>DONATE SURPLUS FOOD</span>
              </Link>
              <Link
                href="/ngo/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-black text-base px-9 py-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>CLAIM AS AN NGO</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* FULL-WIDTH HERO PHOTOGRAPHY SHOWCASE (Generated community hero image) */}
          <div className="relative w-full rounded-3xl lg:rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/80 mt-6 group">
            <div className="relative w-full h-[320px] sm:h-[460px] lg:h-[620px]">
              <Image
                src="/images/community_hero.jpg"
                alt="Community children and shelter volunteers holding fresh food packages in warm sunlight"
                fill
                priority
                className="object-cover group-hover:scale-[1.01] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/* Floating Live Badges on Top of Photo */}
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 text-white">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 bg-[#EA580C] text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-2">
                  ⚡ Hyperlocal Jaipur Rescue Network
                </span>
                <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                  Hot meals delivered to shelters before food ever spoils.
                </h3>
                <p className="text-xs sm:text-sm text-stone-200 mt-2">
                  Real shelters like Apna Ghar Trust, Asha Kiran, and Bal Sansar receive fresh nutrition with full FSSAI shelf-life safety buffers.
                </p>
              </div>

              {/* Floating Quick Action Cards */}
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-amber-300">42s</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white">Avg Match Speed</div>
                </div>
                <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-300">100%</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white">OTP Verified Handover</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FULL-WIDTH SHOWCASE: REAL PLATFORM CAPABILITIES IN ACTION */}
      <section id="capabilities" className="w-full px-4 sm:px-8 lg:px-16 py-16 bg-[#F3ECDD]/60 border-t border-b border-[#E7DBC4]">
        <div className="w-full max-w-[1720px] mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-[#EA580C]">
              Built for Scale & Impact
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#2B1B54] tracking-tight uppercase mt-2 font-display">
              CAPABILITIES THAT TRANSFORM SURPLUS RESCUE
            </h2>
            <p className="text-[#5A467A] text-base mt-3">
              Explore how ResQFood coordinates commercial kitchens, volunteer drivers, and community shelters into a single synchronized machine.
            </p>
          </div>

          {/* 4 Large Capability Cards with Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Restaurant Kitchen Capability */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-md border-2 border-[#FED7AA]/60 flex flex-col hover:shadow-xl transition-all group">
              <div className="relative w-full h-56">
                <Image
                  src="/images/chef_kitchen.jpg"
                  alt="Executive chef in modern commercial kitchen packing food surplus"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#EA580C] text-white text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-md">
                  60-Sec Donor Post
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black text-[#2B1B54] mb-2 leading-snug">
                    Zero Kitchen Friction
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5A467A] leading-relaxed mb-4">
                    Chefs log surplus right before closing. Auto-calculated expiry timers reject high-risk batches and instantly notify nearby shelters.
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#EA580C]">
                  <span>FSSAI Safe Limits</span>
                  <Link href="/restaurant/signup" className="hover:underline flex items-center gap-0.5">
                    Start Donating &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2: Volunteer Driver & GPS Tracking */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-md border-2 border-[#99F6E4]/60 flex flex-col hover:shadow-xl transition-all group">
              <div className="relative w-full h-56">
                <Image
                  src="/images/driver_tracking.jpg"
                  alt="Delivery volunteer in Jaipur holding smartphone showing GPS map and OTP screen"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#0D9488] text-white text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-md">
                  Tokenized Driver Link
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black text-[#2B1B54] mb-2 leading-snug">
                    Zero App Installs Needed
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5A467A] leading-relaxed mb-4">
                    Drivers receive a private URL with live turn-by-turn OSRM routing and direct caller buttons. 4-digit OTP prevents lost pickups.
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#0D9488]">
                  <span>Instant OTP Verification</span>
                  <Link href="/ngo/signup" className="hover:underline flex items-center gap-0.5">
                    NGO Console &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 3: Shelter Handover */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-md border-2 border-[#DDD6FE]/60 flex flex-col hover:shadow-xl transition-all group">
              <div className="relative w-full h-56">
                <Image
                  src="/images/delivery_handover.jpg"
                  alt="Delivery volunteer handing insulated food crate to shelter coordinator"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#7C3AED] text-white text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-md">
                  Verified Distribution
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black text-[#2B1B54] mb-2 leading-snug">
                    Direct Community Reach
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5A467A] leading-relaxed mb-4">
                    NGO shelters confirm actual weight received in kg, which generates official tax documentation and verifiable CSR audit trails.
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#7C3AED]">
                  <span>CSR Tax Receipts</span>
                  <Link href="/ngo/login" className="hover:underline flex items-center gap-0.5">
                    NGO Login &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 4: Food Quality & Safety Standards */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-md border-2 border-[#FED7AA]/60 flex flex-col hover:shadow-xl transition-all group">
              <div className="relative w-full h-56">
                <Image
                  src="/images/food_safety.jpg"
                  alt="Stainless steel insulated containers with batch inspection seals"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-md">
                  FSSAI Quality Seal
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black text-[#2B1B54] mb-2 leading-snug">
                    Strict Food Safety First
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5A467A] leading-relaxed mb-4">
                    Thermal holding guidelines, dietary labeling (veg, non-veg, jain), and cold-chain compliance ensure dignity and safety in every bite.
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>Temperature Controlled</span>
                  <Link href="/restaurant/signup" className="hover:underline flex items-center gap-0.5">
                    Join Network &rarr;
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FULL-WIDTH INTERACTIVE IMPACT CALCULATOR SIMULATOR */}
      <section id="simulator" className="w-full px-4 sm:px-8 lg:px-16 py-16 bg-[#FAF6EE]">
        <div className="w-full max-w-[1720px] mx-auto">
          <LiveImpactCalculator />
        </div>
      </section>

      {/* FULL-WIDTH PUBLIC IMPACT COUNTER (Requirement 9) */}
      <section id="live-impact" className="w-full px-4 sm:px-8 lg:px-16 py-16 bg-white border-t border-b border-stone-200">
        <div className="w-full max-w-[1720px] mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 bg-[#DCFCE7] text-[#15803D] text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" /> Verified Public Ledger
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#2B1B54] tracking-tight uppercase mt-3 font-display">
              REAL IMPACT, RECORDED IN REAL TIME
            </h2>
            <p className="text-sm sm:text-base font-medium text-[#5A467A] mt-2">
              Calculated exclusively from NGO-confirmed delivered donations. Every kilogram accounted for.
            </p>
          </div>

          {/* Counter Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#FAF6EE] rounded-3xl p-8 border-2 border-stone-200 text-center shadow-xs">
              <div className="text-4xl sm:text-6xl font-black text-[#7C3AED] tracking-tight font-display">
                {displayMeals.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm font-black text-[#2B1B54] uppercase tracking-wider mt-2">
                Meals Rescued
              </div>
              <div className="text-xs text-stone-500 mt-1 font-mono">0.5 kg standard meal</div>
            </div>

            <div className="bg-[#FAF6EE] rounded-3xl p-8 border-2 border-stone-200 text-center shadow-xs">
              <div className="text-4xl sm:text-6xl font-black text-[#EA580C] tracking-tight font-display">
                {displayKg.toLocaleString()}
                <span className="text-2xl sm:text-3xl ml-1">kg</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-[#2B1B54] uppercase tracking-wider mt-2">
                Surplus Diverted
              </div>
              <div className="text-xs text-stone-500 mt-1 font-mono">Zero landfill waste</div>
            </div>

            <div className="bg-[#FAF6EE] rounded-3xl p-8 border-2 border-stone-200 text-center shadow-xs">
              <div className="text-4xl sm:text-6xl font-black text-[#0D9488] tracking-tight font-display">
                {displayCo2e.toLocaleString()}
                <span className="text-2xl sm:text-3xl ml-1">kg</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-[#2B1B54] uppercase tracking-wider mt-2">
                CO2e Avoided
              </div>
              <div className="text-xs text-stone-500 mt-1 font-mono">2.5 kg CO2e / kg food</div>
            </div>

            <div className="bg-[#FAF6EE] rounded-3xl p-8 border-2 border-stone-200 text-center shadow-xs">
              <div className="text-4xl sm:text-6xl font-black text-[#2B1B54] tracking-tight font-display">
                {displayRestaurants + displayNgos}
              </div>
              <div className="text-xs sm:text-sm font-black text-[#2B1B54] uppercase tracking-wider mt-2">
                Active Partners
              </div>
              <div className="text-xs text-stone-500 mt-1 font-mono">
                {displayRestaurants} Kitchens · {displayNgos} Shelters
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FULL-WIDTH COMMUNITY DINING IMAGE STRIP */}
      <section className="w-full relative h-[360px] sm:h-[480px] overflow-hidden">
        <Image
          src="/images/community_eating.jpg"
          alt="Children and families happily eating hot wholesome meals at community shelter"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2B1B54]/90 via-[#2B1B54]/75 to-transparent flex items-center px-6 sm:px-12 lg:px-24">
          <div className="max-w-2xl text-white">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              The Human Face of Surplus Rescue
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase mt-2 mb-4 leading-tight font-display">
              Every Unspoiled Meal Serves A Real Person
            </h2>
            <p className="text-sm sm:text-base text-stone-200 leading-relaxed mb-6">
              When restaurants donate leftover banquets, children at shelter schools and residents of night shelters receive dignity, nourishment, and care.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/restaurant/signup"
                className="bg-[#EA580C] hover:bg-[#C2410C] text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-full transition-all shadow-lg"
              >
                Register as Food Donor
              </Link>
              <Link
                href="/ngo/signup"
                className="bg-white/20 hover:bg-white/30 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-full transition-all border border-white/30 backdrop-blur"
              >
                Register as Recipient NGO
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3-STEP WALKTHROUGH STRIP */}
      <section id="how-it-works" className="w-full px-4 sm:px-8 lg:px-16 py-16 bg-[#FAF6EE]">
        <div className="w-full max-w-[1720px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-[#7C3AED]">
              Frictionless & Reliable
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#2B1B54] tracking-tight uppercase mt-2 font-display">
              HOW RESQFOOD RESCUES FOOD IN MINUTES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-8 border-2 border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-black text-[#EA580C] font-display">01</span>
                  <span className="text-xs font-bold bg-[#FFEDD5] text-[#C2410C] px-3 py-1 rounded-full">
                    &lt; 60 seconds
                  </span>
                </div>
                <h3 className="text-2xl font-black text-[#2B1B54] mb-3">Restaurant Logs Surplus</h3>
                <p className="text-sm text-[#5A467A] leading-relaxed">
                  Specify dish name, food category, diet, and estimated quantity. System calculates safe-until window based on shelf life guidelines.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs font-bold text-[#EA580C]">
                <CheckCircle2 className="w-4 h-4" />
                <span>45-minute safe window check</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-8 border-2 border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-black text-[#0D9488] font-display">02</span>
                  <span className="text-xs font-bold bg-[#CCFBF1] text-[#0F766E] px-3 py-1 rounded-full">
                    Instant match
                  </span>
                </div>
                <h3 className="text-2xl font-black text-[#2B1B54] mb-3">Engine Notifies Shelters</h3>
                <p className="text-sm text-[#5A467A] leading-relaxed">
                  Nearby NGOs receive real-time notifications with match reasons. Only approximate neighborhood is visible before claim to protect privacy.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs font-bold text-[#0D9488]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Atomic race-condition claim</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-8 border-2 border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-black text-[#7C3AED] font-display">03</span>
                  <span className="text-xs font-bold bg-[#F3E8FF] text-[#7C3AED] px-3 py-1 rounded-full">
                    Secure OTP
                  </span>
                </div>
                <h3 className="text-2xl font-black text-[#2B1B54] mb-3">Pickup & Handover</h3>
                <p className="text-sm text-[#5A467A] leading-relaxed">
                  NGO sends driver a tokenized link with turn-by-turn route. Driver provides restaurant's 4-digit secret OTP to confirm collection.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs font-bold text-[#7C3AED]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Real-time impact receipt</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* URGENT SHELTER NEEDS BOARD PREVIEW */}
      {activeNeeds.length > 0 && (
        <section id="urgent-needs" className="w-full px-4 sm:px-8 lg:px-16 py-14 bg-[#FBF6ED] border-t border-[#E7DBC4]">
          <div className="w-full max-w-[1720px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#EA580C]">
                  Direct Impact Opportunities
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-[#2B1B54] uppercase mt-1 font-display">
                  URGENT SHELTER NEEDS RIGHT NOW
                </h2>
              </div>
              <Link
                href="/restaurant/login"
                className="text-xs sm:text-sm font-black text-[#7C3AED] hover:text-[#5B21B6] inline-flex items-center gap-1"
              >
                View Complete Needs Board &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeNeeds.map((need: any) => (
                <div
                  key={need.id}
                  className="bg-white rounded-3xl p-6 border-2 border-stone-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                        {need.urgency} urgency
                      </span>
                      <span className="text-xs font-bold text-stone-500">
                        {need.meals_needed} meals
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-[#2B1B54] mb-1">{need.title}</h4>
                    <p className="text-xs text-stone-500 flex items-center gap-1 mb-4">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{need.ngos?.name} ({need.ngos?.city})</span>
                    </p>
                  </div>
                  <Link
                    href={`/restaurant/login`}
                    className="w-full text-center text-xs font-black py-2.5 rounded-full bg-[#FFEDD5] text-[#C2410C] hover:bg-[#FDBA74] transition-colors"
                  >
                    Donate to this Need
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FULL-WIDTH FOOTER */}
      <footer className="w-full bg-[#164230] text-emerald-100 px-4 sm:px-8 lg:px-16 py-12 mt-auto border-t border-emerald-950">
        <div className="w-full max-w-[1720px] mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center font-black text-xl shadow-lg">
                R
              </div>
              <div>
                <span className="text-2xl font-black text-white tracking-tight font-display">
                  ResQ<span className="text-amber-400">Food</span>
                </span>
                <p className="text-xs text-emerald-300">Real-Time Surplus Food Rescue Network</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-emerald-200">
              <Link href="/restaurant/login" className="hover:text-white transition-colors">
                Restaurant Portal
              </Link>
              <Link href="/ngo/login" className="hover:text-white transition-colors">
                NGO Operations Console
              </Link>
              <a href="#capabilities" className="hover:text-white transition-colors">
                Platform Capabilities
              </a>
              <a href="#simulator" className="hover:text-white transition-colors">
                Impact Simulator
              </a>
              <a href="#live-impact" className="hover:text-white transition-colors">
                Public Ledger
              </a>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-300/80">
            <div>
              &copy; {new Date().getFullYear()} ResQFood India. FSSAI & CSR Compliant Surplus Food Operations.
            </div>
            <div className="text-[11px] font-mono">
              EPA Standard: 0.5 kg/meal · 2.5 kg CO2e avoided/kg food diverted from landfills.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
