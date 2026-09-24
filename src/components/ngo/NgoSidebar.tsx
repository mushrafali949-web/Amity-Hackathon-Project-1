'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NGO } from '@/types/database';
import {
  Compass,
  Radio,
  Truck,
  Megaphone,
  Sliders,
  BarChart2,
  Building2,
  LogOut,
  HeartHandshake,
} from 'lucide-react';

const NGO_NAV_ITEMS = [
  { href: '/ngo/console', label: 'Command Console', icon: Compass },
  { href: '/ngo/feed', label: 'Nearby Food Feed', icon: Radio },
  { href: '/ngo/pickups', label: 'Pickups & Drivers', icon: Truck },
  { href: '/ngo/needs', label: 'Broadcast Needs', icon: Megaphone },
  { href: '/ngo/capacity', label: 'Capacity & Preferences', icon: Sliders },
  { href: '/ngo/impact', label: 'Impact & Donors', icon: BarChart2 },
  { href: '/ngo/profile', label: 'Organization Profile', icon: Building2 },
];

export function NgoSidebar({ ngo }: { ngo: NGO | null }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-stone-900 text-stone-200 hidden md:flex flex-col border-r border-stone-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-stone-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-lg font-black">
          <HeartHandshake className="w-6 h-6" />
        </div>
        <div>
          <span className="font-black text-base text-white tracking-tight">
            ResQ<span className="text-teal-400">Food</span>
          </span>
          <div className="text-[10px] text-teal-300 uppercase tracking-widest font-semibold">
            NGO Console
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NGO_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-teal-600/90 text-white shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-stone-400'}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer User & Sign out */}
      <div className="p-4 border-t border-stone-800 bg-stone-950/50 flex items-center justify-between">
        <div className="truncate text-xs">
          <p className="font-bold text-stone-200 truncate">{ngo?.name || 'NGO Partner'}</p>
          <p className="text-[10px] text-stone-500 truncate">{ngo?.city || 'Jaipur'}</p>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            title="Sign out"
            className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
