'use client';

import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./NgoConsoleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-stone-100 rounded-3xl flex items-center justify-center text-xs text-stone-400 font-semibold border border-stone-200">
      Loading interactive area map...
    </div>
  ),
});

export function DynamicNgoMap(props: any) {
  return <DynamicMap {...props} />;
}
