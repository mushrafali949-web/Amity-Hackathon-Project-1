'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { updateNgoCapacityAction } from '@/lib/actions/ngo';
import { FoodCategory, DietType, NGO } from '@/types/database';
import { FOOD_CATEGORY_LABELS, DIET_LABELS } from '@/lib/config';
import {
  Sliders,
  CheckCircle2,
  Power,
  Sparkles,
  Info,
  Clock,
  Truck,
  Refrigerator,
} from 'lucide-react';

interface NgoCapacityClientProps {
  ngo: NGO;
  matchingSample: any[];
}

export function NgoCapacityClient({ ngo, matchingSample }: NgoCapacityClientProps) {
  const [dailyCapacityKg, setDailyCapacityKg] = useState(ngo.daily_capacity_kg || 60);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(ngo.service_radius_km || 15);
  const [acceptsCategories, setAcceptsCategories] = useState<FoodCategory[]>(
    ngo.accepts_categories || ['cooked_meal', 'bakery', 'dairy']
  );
  const [acceptsDiets, setAcceptsDiets] = useState<DietType[]>(
    ngo.accepts_diets || ['veg', 'non_veg', 'jain', 'mixed']
  );
  const [hasColdStorage, setHasColdStorage] = useState(ngo.has_cold_storage);
  const [hasOwnTransport, setHasOwnTransport] = useState(ngo.has_own_transport);
  const [openFrom, setOpenFrom] = useState(ngo.open_from ? ngo.open_from.slice(0, 5) : '08:00');
  const [openTo, setOpenTo] = useState(ngo.open_to ? ngo.open_to.slice(0, 5) : '22:00');
  const [acceptingDonations, setAcceptingDonations] = useState(ngo.accepting_donations);
  const [saving, setSaving] = useState(false);

  function toggleCategory(cat: FoodCategory) {
    if (acceptsCategories.includes(cat)) {
      setAcceptsCategories(acceptsCategories.filter((c) => c !== cat));
    } else {
      setAcceptsCategories([...acceptsCategories, cat]);
    }
  }

  function toggleDiet(diet: DietType) {
    if (acceptsDiets.includes(diet)) {
      setAcceptsDiets(acceptsDiets.filter((d) => d !== diet));
    } else {
      setAcceptsDiets([...acceptsDiets, diet]);
    }
  }

  // Calculate live preview count
  const matchingCount = matchingSample.filter((d) => {
    if (!acceptingDonations) return false;
    if (acceptsCategories.length > 0 && !acceptsCategories.includes(d.category)) return false;
    if (acceptsDiets.length > 0 && !acceptsDiets.includes(d.diet) && !acceptsDiets.includes('mixed')) return false;
    if (d.quantity_kg > dailyCapacityKg) return false;
    return true;
  }).length;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateNgoCapacityAction({
        dailyCapacityKg,
        serviceRadiusKm,
        acceptsCategories,
        acceptsDiets,
        hasColdStorage,
        hasOwnTransport,
        openFrom,
        openTo,
        acceptingDonations,
      });

      if (res.success) {
        toast.success('Capacity settings & dietary preferences saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          Capacity & Dietary Preferences
        </h1>
        <p className="text-xs text-stone-500">
          Tune your matching algorithm criteria, vehicle readiness, and reception toggles
        </p>
      </div>

      {/* Live Preview Match Callout */}
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-3xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black text-teal-950">Live Matching Algorithm Preview</div>
            <div className="text-xs text-teal-800">
              {acceptingDonations
                ? `Currently ${matchingCount} active donation broadcasts fit these parameters.`
                : 'Donation receiving is currently paused.'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAcceptingDonations(!acceptingDonations)}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs ${
            acceptingDonations
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-stone-800 hover:bg-stone-900 text-white'
          }`}
        >
          <Power className="w-4 h-4" />
          {acceptingDonations ? 'Active (Accepting)' : 'Paused (Locked)'}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Daily Capacity & Service Radius Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5">
          <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider">
            Logistical Limits
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700">Daily Reception Capacity</label>
                <span className="text-sm font-black text-teal-700">{dailyCapacityKg} kg</span>
              </div>
              <input
                type="number"
                min={5}
                max={2000}
                required
                value={dailyCapacityKg}
                onChange={(e) => setDailyCapacityKg(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Approx {Math.round(dailyCapacityKg / 0.5)} meals capacity per day
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700">Rescue Service Radius</label>
                <span className="text-sm font-black text-teal-700">{serviceRadiusKm} km</span>
              </div>
              <input
                type="range"
                min={2}
                max={50}
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(parseInt(e.target.value))}
                className="w-full accent-teal-600 mt-3"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Donations within {serviceRadiusKm} km from your base coordinates will match you
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-100">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Operating Opens</label>
              <input
                type="time"
                value={openFrom}
                onChange={(e) => setOpenFrom(e.target.value)}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Operating Closes</label>
              <input
                type="time"
                value={openTo}
                onChange={(e) => setOpenTo(e.target.value)}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Cold Storage & Own Transport Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider">
            Operational Capabilities
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-4 bg-stone-50 border border-stone-200 rounded-2xl cursor-pointer hover:bg-teal-50/50 transition-colors">
              <input
                type="checkbox"
                checked={hasColdStorage}
                onChange={(e) => setHasColdStorage(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded mt-0.5"
              />
              <div>
                <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Refrigerator className="w-4 h-4 text-teal-600" /> Commercial Cold Storage / Fridges
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Grants high priority matching bonus for perishable cooked meals and dairy.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 bg-stone-50 border border-stone-200 rounded-2xl cursor-pointer hover:bg-teal-50/50 transition-colors">
              <input
                type="checkbox"
                checked={hasOwnTransport}
                onChange={(e) => setHasOwnTransport(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded mt-0.5"
              />
              <div>
                <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-teal-600" /> Dedicated Rescue Van / Fleet
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Enables rapid independent collection outside standard operating windows.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Dietary and Category Selection Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5">
          <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider">
            Accepted Food Specifications
          </h2>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Food Categories Accepted
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FOOD_CATEGORY_LABELS) as FoodCategory[]).map((cat) => {
                const active = acceptsCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all border ${
                      active
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {FOOD_CATEGORY_LABELS[cat]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Diets Accepted
            </label>
            <div className="flex flex-wrap gap-2">
              {(['veg', 'non_veg', 'jain', 'mixed'] as DietType[]).map((d) => {
                const active = acceptsDiets.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDiet(d)}
                    className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all border ${
                      active
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {DIET_LABELS[d]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? 'Saving Preferences...' : 'Save Capacity & Preferences'}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
