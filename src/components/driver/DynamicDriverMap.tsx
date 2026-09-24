'use client';

import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./DriverRouteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-stone-900 rounded-3xl flex items-center justify-center text-xs text-stone-500 font-semibold border border-stone-800">
      Loading driver GPS route...
    </div>
  ),
});

export function DynamicDriverMap(props: any) {
  return <DynamicMap {...props} />;
}
