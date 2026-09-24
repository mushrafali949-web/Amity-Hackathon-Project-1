'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Clock, Heart, BarChart3, User } from 'lucide-react';

export function RestaurantMobileTabBar() {
  const pathname = usePathname();

  const tabs = [
    { href: '/restaurant/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/restaurant/donations', label: 'Tracker', icon: Clock },
    { href: '/restaurant/post', label: 'Post', icon: PlusCircle, isPrimary: true },
    { href: '/restaurant/needs', label: 'Needs', icon: Heart },
    { href: '/restaurant/impact', label: 'Impact', icon: BarChart3 },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-2 flex items-center justify-around shadow-lg">
      {tabs.map(({ href, label, icon: Icon, isPrimary }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);

        if (isPrimary) {
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center -mt-5"
            >
              <div className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg border-4 border-white active:scale-95 transition-transform">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-orange-600 mt-0.5">{label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${
              active ? 'text-orange-600 font-bold' : 'text-stone-500 hover:text-stone-900 font-medium'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
