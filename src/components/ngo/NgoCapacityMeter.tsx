'use client';

import { Gauge } from 'lucide-react';

interface NgoCapacityMeterProps {
  dailyCapacityKg: number;
  remainingCapacityKg: number;
  acceptingDonations: boolean;
}

export function NgoCapacityMeter({
  dailyCapacityKg,
  remainingCapacityKg,
  acceptingDonations,
}: NgoCapacityMeterProps) {
  const percentage = Math.min(
    100,
    Math.round(((dailyCapacityKg - remainingCapacityKg) / (dailyCapacityKg || 1)) * 100)
  );

  return (
    <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl">
      <Gauge className="w-4 h-4 text-teal-600 shrink-0" />
      <div className="flex flex-col min-w-[120px]">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-stone-600">Capacity Today:</span>
          <span className={remainingCapacityKg > 0 ? 'text-teal-700' : 'text-red-600'}>
            {remainingCapacityKg} kg left
          </span>
        </div>
        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mt-1">
          <div
            className={`h-full transition-all duration-300 ${
              percentage > 85 ? 'bg-red-500' : percentage > 50 ? 'bg-amber-500' : 'bg-teal-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      {!acceptingDonations && (
        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
          Paused
        </span>
      )}
    </div>
  );
}
