'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Clock, Heart, BarChart3, User } from 'lucide-react';

const LINKS = [
  { href: '/restaurant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/restaurant/donations', label: 'Tracker', icon: Clock },
  { href: '/restaurant/needs', label: 'NGO Needs', icon: Heart },
  { href: '/restaurant/impact', label: 'Impact & Tax', icon: BarChart3 },
  { href: '/restaurant/profile', label: 'Kitchen Profile', icon: User },
];

export function RestaurantNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              active
                ? 'bg-orange-100/80 text-orange-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${active ? 'text-orange-600' : 'text-stone-400'}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
