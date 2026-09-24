'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { postDonationAction } from '@/lib/actions/donation';
import { FoodCategory, DietType, Restaurant, Donation } from '@/types/database';
import { FOOD_CATEGORY_LABELS, DIET_LABELS, SHELF_LIFE_HOURS } from '@/lib/config';
import { calculateDefaultSafeUntil, calculateRiskScore } from '@/lib/safety';
import {
  UtensilsCrossed,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Plus,
  Minus,
  MapPin,
  Search,
  LocateFixed,
  Camera,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface PostDonationFormProps {
  restaurant: Restaurant | null;
  lastDonation: Donation | null;
}

export function PostDonationForm({ restaurant, lastDonation }: PostDonationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL prefill from "Donate to this NGO" button
  const directedNgoId = searchParams.get('directed_ngo_id');
  const needId = searchParams.get('need_id');
  const prefillTitle = searchParams.get('title') || '';
  const prefillDiet = (searchParams.get('diet') as DietType) || 'mixed';
  const prefillQty = searchParams.get('quantity') ? parseFloat(searchParams.get('quantity')!) : 10;

  // Form States
  const [title, setTitle] = useState(prefillTitle);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FoodCategory>('cooked_meal');
  const [diet, setDiet] = useState<DietType>(prefillDiet);
  const [quantityKg, setQuantityKg] = useState<number>(prefillQty);
  const [servings, setServings] = useState<number>(Math.round(prefillQty / 0.5));

  // Prepared at time (ISO string or datetime-local format)
  const [preparedAt, setPreparedAt] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  // Hours until safe (defaults to category shelf life)
  const [safeHours, setSafeHours] = useState<number>(SHELF_LIFE_HOURS['cooked_meal']);

  // Pickup Location
  const [pickupAddress, setPickupAddress] = useState(restaurant?.address || 'Jaipur');
  const [pickupLat, setPickupLat] = useState(restaurant?.lat || 26.9124);
  const [pickupLng, setPickupLng] = useState(restaurant?.lng || 75.7873);
  const [areaLabel, setAreaLabel] = useState(`${restaurant?.city || 'Jaipur'} Central`);

  // Location search
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Photo
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Loading & error
  const [loading, setLoading] = useState(false);

  // Update default shelf hours when category changes
  useEffect(() => {
    const maxHours = SHELF_LIFE_HOURS[category] || 4;
    setSafeHours(maxHours);
  }, [category]);

  // Update servings when quantity changes
  useEffect(() => {
    setServings(Math.round(quantityKg / 0.5));
  }, [quantityKg]);

  // Compute Safe Until timestamp
  const prepDate = new Date(preparedAt || new Date().toISOString());
  const safeUntilDate = new Date(prepDate.getTime() + safeHours * 60 * 60 * 1000);
  const maxSafeDate = calculateDefaultSafeUntil(category, prepDate);

  // Compute live Risk Score
  const { score: riskScore, level: riskLevel } = calculateRiskScore(
    category,
    prepDate,
    safeUntilDate
  );

  const remainingSafeMins = Math.floor((safeUntilDate.getTime() - Date.now()) / (60 * 1000));
  const isTooShort = remainingSafeMins < 45;

  function repeatLast() {
    if (!lastDonation) return;
    setTitle(lastDonation.title);
    setCategory(lastDonation.category);
    setDiet(lastDonation.diet);
    setQuantityKg(lastDonation.quantity_kg);
    setServings(lastDonation.servings || Math.round(lastDonation.quantity_kg / 0.5));
    if (lastDonation.description) setDescription(lastDonation.description);
    toast.success('Prefilled from your last donation!');
  }

  function adjustQuantity(delta: number) {
    setQuantityKg((prev) => Math.max(1, Math.round((prev + delta) * 10) / 10));
  }

  async function handleSearchAddress() {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (Array.isArray(data)) setSearchResults(data);
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const cLat = pos.coords.latitude;
        const cLng = pos.coords.longitude;
        setPickupLat(cLat);
        setPickupLng(cLng);
        try {
          const res = await fetch(`/api/geocode?lat=${cLat}&lng=${cLng}`);
          const data = await res.json();
          if (data.display_name) {
            setPickupAddress(data.display_name);
            setAreaLabel(data.city ? `${data.city} Area` : 'Jaipur Area');
          }
        } catch {
          // keep
        }
      },
      () => toast.error('Unable to retrieve current GPS')
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a meal title');
      return;
    }
    if (quantityKg <= 0) {
      toast.error('Quantity must be greater than 0 kg');
      return;
    }
    if (isTooShort) {
      toast.error('Safe window is under 45 minutes. Cannot post unsafe food.');
      return;
    }

    setLoading(true);

    try {
      const res = await postDonationAction({
        title,
        description: description || undefined,
        category,
        diet,
        quantity_kg: quantityKg,
        servings,
        prepared_at: prepDate.toISOString(),
        safe_until: safeUntilDate.toISOString(),
        pickup_address: pickupAddress,
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        area_label: areaLabel,
        contact_name: restaurant?.name || undefined,
        contact_phone: restaurant?.phone || undefined,
        photo_url: photoUrl,
        directed_ngo_id: directedNgoId || undefined,
        need_id: needId || undefined,
      });

      if (!res.success) {
        toast.error(res.error || 'Failed to post donation');
        setLoading(false);
        return;
      }

      toast.success('Food posted! Matching nearby NGOs...');
      router.push(`/restaurant/donations/${res.donationId}`);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Bar & Quick Repeat Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Post Surplus Food
          </h1>
          <p className="text-xs text-stone-500">Fast 60-second rescue broadcast</p>
        </div>

        {lastDonation && (
          <button
            type="button"
            onClick={repeatLast}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-900 text-xs font-bold rounded-xl transition-colors border border-orange-200"
          >
            <RotateCcw className="w-3.5 h-3.5 text-orange-600" /> Repeat Last Donation
          </button>
        )}
      </div>

      {directedNgoId && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl flex items-center gap-2 text-xs text-teal-900">
          <Info className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong>Directed Donation:</strong> This food will first be offered exclusively to the
            selected NGO fulfilling their active request.
          </span>
        </div>
      )}

      {/* Main Card: What & Diet */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md space-y-5">
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
            What Food Do You Have?
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 20 Portions Paneer Butter Masala & Roti"
            className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-bold text-base focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        {/* Category Chips */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
            Food Category
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FOOD_CATEGORY_LABELS) as FoodCategory[]).map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all border ${
                    active
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {FOOD_CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Diet Chips */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
            Dietary Specification
          </label>
          <div className="flex flex-wrap gap-2">
            {(['veg', 'non_veg', 'jain', 'mixed'] as DietType[]).map((d) => {
              const active = diet === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiet(d)}
                  className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all border ${
                    active
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
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

      {/* Quantity & Servings Card */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md space-y-4">
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
          Approximate Quantity & Servings
        </label>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full flex items-center justify-between bg-stone-50 border border-stone-300 rounded-2xl p-2">
            <button
              type="button"
              onClick={() => adjustQuantity(-5)}
              className="p-2 bg-white rounded-xl shadow-xs hover:bg-stone-100 text-stone-700 font-bold"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="text-center">
              <span className="text-3xl font-black text-stone-900">{quantityKg}</span>
              <span className="text-sm font-bold text-stone-500 ml-1">kg</span>
            </div>

            <button
              type="button"
              onClick={() => adjustQuantity(5)}
              className="p-2 bg-white rounded-xl shadow-xs hover:bg-stone-100 text-stone-700 font-bold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Increment Chips */}
          <div className="flex gap-2">
            {[1, 5, 10, 20].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => adjustQuantity(step)}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl"
              >
                +{step} kg
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-stone-500 flex items-center justify-between pt-1">
          <span>
            Feeds approx <strong>~{servings} people</strong> (based on standard 0.5 kg/meal)
          </span>
          <span className="text-stone-400">Can be adjusted upon driver pickup</span>
        </div>
      </div>

      {/* Food Safety & Safe Until Card */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-orange-600" /> Food Safety Window
          </label>

          {/* Risk Badge */}
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-black flex items-center gap-1 ${
              riskLevel === 'high'
                ? 'bg-red-100 text-red-700'
                : riskLevel === 'medium'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Risk: {riskLevel.toUpperCase()} ({riskScore}%)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1">Prepared At</label>
            <input
              type="datetime-local"
              required
              value={preparedAt}
              onChange={(e) => setPreparedAt(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-bold text-stone-500 mb-1">
              <span>Safe Window Duration</span>
              <span className="text-orange-600 font-bold">{safeHours} hours max</span>
            </div>
            <input
              type="range"
              min={1}
              max={SHELF_LIFE_HOURS[category]}
              step={0.5}
              value={safeHours}
              onChange={(e) => setSafeHours(parseFloat(e.target.value))}
              className="w-full accent-orange-600 mt-2"
            />
          </div>
        </div>

        {/* Calculated Safe Until Display */}
        <div
          className={`p-3 rounded-2xl text-xs flex items-center justify-between ${
            isTooShort
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-amber-50/70 text-amber-900 border border-amber-200'
          }`}
        >
          <div>
            <span className="font-bold">Must be consumed before: </span>
            <span>
              {safeUntilDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (
              {safeUntilDate.toLocaleDateString()})
            </span>
          </div>
          <span className="font-mono font-bold">
            {remainingSafeMins > 0 ? `${remainingSafeMins} mins left` : 'Expired'}
          </span>
        </div>

        {isTooShort && (
          <div className="text-xs text-red-600 flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Window is under 45 minutes. Cannot post surplus with inadequate collection time.
          </div>
        )}
      </div>

      {/* Pickup Location Card */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md space-y-4">
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
          Pickup Address & Instructions
        </label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pickup area (or drop pin)"
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </div>
          <button
            type="button"
            onClick={handleSearchAddress}
            disabled={searching}
            className="px-3 py-2 bg-stone-800 text-white rounded-lg text-xs font-bold"
          >
            {searching ? 'Finding...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            title="Use GPS"
            className="p-2 border border-stone-300 rounded-lg hover:bg-stone-100"
          >
            <LocateFixed className="w-4 h-4 text-orange-600" />
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="max-h-36 overflow-y-auto bg-white border border-stone-200 rounded-xl p-1 shadow-md space-y-1">
            {searchResults.map((res, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPickupAddress(res.display_name);
                  setPickupLat(res.lat);
                  setPickupLng(res.lng);
                  setAreaLabel(res.city ? `${res.city} Area` : 'Jaipur Area');
                  setSearchResults([]);
                }}
                className="w-full text-left p-2 hover:bg-orange-50 rounded-lg text-xs text-stone-800 flex items-start gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                <span className="truncate">{res.display_name}</span>
              </button>
            ))}
          </div>
        )}

        <textarea
          rows={2}
          required
          value={pickupAddress}
          onChange={(e) => setPickupAddress(e.target.value)}
          placeholder="Detailed pickup address for drivers"
          className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
        />

        <div>
          <label className="block text-[11px] font-bold text-stone-500 mb-1">
            Driver Pickup Instructions / Notes
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Bring food grade containers, enter through rear service gate"
            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Primary Submit Button */}
      <button
        type="submit"
        disabled={loading || isTooShort}
        className="w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base shadow-xl transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? 'Broadcasting to NGOs...' : 'Post Food & Broadcast Now'}
        <ArrowRight className="w-5 h-5" />
      </button>
    </form>
  );
}
