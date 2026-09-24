'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FoodCategory, DietType } from '@/types/database';
import { FOOD_CATEGORY_LABELS, DIET_LABELS } from '@/lib/config';
import {
  HeartHandshake,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Search,
  LocateFixed,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';

export default function NgoSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Contact person & Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Organization & Coverage
  const [ngoName, setNgoName] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [address, setAddress] = useState('Civil Lines, Ajmer Road');
  const [city, setCity] = useState('Jaipur');
  const [lat, setLat] = useState(26.9085);
  const [lng, setLng] = useState(75.792);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15);
  const [peopleServedDaily, setPeopleServedDaily] = useState(150);

  // Geocoding helper states
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Step 3: Capacity & Preferences
  const [dailyCapacityKg, setDailyCapacityKg] = useState(60);
  const [hasColdStorage, setHasColdStorage] = useState(true);
  const [hasOwnTransport, setHasOwnTransport] = useState(true);
  const [openFrom, setOpenFrom] = useState('08:00');
  const [openTo, setOpenTo] = useState('22:00');
  const [acceptedCategories, setAcceptedCategories] = useState<FoodCategory[]>([
    'cooked_meal',
    'bakery',
    'dairy',
    'packaged',
    'raw_produce',
  ]);
  const [acceptedDiets, setAcceptedDiets] = useState<DietType[]>([
    'veg',
    'non_veg',
    'jain',
    'mixed',
  ]);

  function validateStep1() {
    if (!email || !password || !contactPerson || !phone) {
      setError('Please fill in all contact & account fields');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    setError(null);
    return true;
  }

  function validateStep2() {
    if (!ngoName || !address || !city) {
      setError('Please provide organization name, address, and city');
      return false;
    }
    setError(null);
    return true;
  }

  function validateStep3() {
    if (acceptedCategories.length === 0) {
      setError('Select at least one accepted food category');
      return false;
    }
    if (acceptedDiets.length === 0) {
      setError('Select at least one accepted dietary type');
      return false;
    }
    if (dailyCapacityKg <= 0) {
      setError('Daily capacity must be greater than 0 kg');
      return false;
    }
    setError(null);
    return true;
  }

  async function handleSearchAddress() {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSearchResults(data);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const cLat = pos.coords.latitude;
        const cLng = pos.coords.longitude;
        setLat(cLat);
        setLng(cLng);
        try {
          const res = await fetch(`/api/geocode?lat=${cLat}&lng=${cLng}`);
          const data = await res.json();
          if (data.display_name) {
            setAddress(data.display_name);
            setCity(data.city || 'Jaipur');
          }
        } catch {
          // keep coords
        }
      },
      () => {
        setError('Unable to retrieve your location');
      }
    );
  }

  function toggleCategory(cat: FoodCategory) {
    if (acceptedCategories.includes(cat)) {
      setAcceptedCategories(acceptedCategories.filter((c) => c !== cat));
    } else {
      setAcceptedCategories([...acceptedCategories, cat]);
    }
  }

  function toggleDiet(diet: DietType) {
    if (acceptedDiets.includes(diet)) {
      setAcceptedDiets(acceptedDiets.filter((d) => d !== diet));
    } else {
      setAcceptedDiets([...acceptedDiets, diet]);
    }
  }

  async function handleCompleteSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const origin = window.location.origin;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'ngo',
            full_name: contactPerson,
            phone,
            ngo_name: ngoName,
            registration_no: registrationNo || null,
            address,
            city,
            lat,
            lng,
            service_radius_km: serviceRadiusKm,
            people_served_daily: peopleServedDaily,
            daily_capacity_kg: dailyCapacityKg,
            accepts_categories: acceptedCategories,
            accepts_diets: acceptedDiets,
            has_cold_storage: hasColdStorage,
            has_own_transport: hasOwnTransport,
            open_from: openFrom ? `${openFrom}:00` : '08:00:00',
            open_to: openTo ? `${openTo}:00` : '22:00:00',
          },
          emailRedirectTo: `${origin}/auth/callback?role=ngo`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push('/ngo/console');
      } else {
        router.push('/auth/check-email');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4fbf9] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-teal-600 text-white items-center justify-center shadow-lg mb-3">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-stone-900">Register NGO / Shelter</h1>
          <p className="text-sm text-stone-600 mt-1">
            Step {step} of 3:{' '}
            {step === 1
              ? 'Contact & Account'
              : step === 2
              ? 'Organization Details'
              : 'Capacity & Preferences'}
          </p>

          {/* Stepper Bar */}
          <div className="w-full bg-stone-200 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-teal-600 h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-stone-200 shadow-xl space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Contact Person Full Name
                </label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Sunita Meena (Operations Head)"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Official Phone / Mobile
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 94140 54321"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Organization Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@jaipurrelief.org"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  Continue to Organization Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  NGO / Shelter Name
                </label>
                <input
                  type="text"
                  required
                  value={ngoName}
                  onChange={(e) => setNgoName(e.target.value)}
                  placeholder="Apna Ghar Seva Trust"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Registration / Darpan ID
                  </label>
                  <input
                    type="text"
                    value={registrationNo}
                    onChange={(e) => setRegistrationNo(e.target.value)}
                    placeholder="RJ/2021/019283"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    People Served Daily
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={peopleServedDaily}
                    onChange={(e) => setPeopleServedDaily(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Location & Radius */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Base Location & Service Radius
                </label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search base area (e.g. Civil Lines, Jaipur)"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchAddress}
                    disabled={searching}
                    className="px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-bold"
                  >
                    {searching ? 'Finding...' : 'Find'}
                  </button>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    title="Use GPS Location"
                    className="p-2 border border-stone-300 hover:bg-stone-100 rounded-lg text-stone-700"
                  >
                    <LocateFixed className="w-4 h-4 text-teal-600" />
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-36 overflow-y-auto bg-white border border-stone-200 rounded-xl p-1 shadow-md space-y-1">
                    {searchResults.map((res, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setAddress(res.display_name);
                          setCity(res.city);
                          setLat(res.lat);
                          setLng(res.lng);
                          setSearchResults([]);
                        }}
                        className="w-full text-left p-2 hover:bg-teal-50 rounded-lg text-xs text-stone-800 flex items-start gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span className="truncate">{res.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full office/shelter address"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />

                <div className="pt-2">
                  <div className="flex justify-between text-xs text-stone-600 mb-1 font-semibold">
                    <span>Rescue Service Radius:</span>
                    <span className="text-teal-700 font-bold">{serviceRadiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={50}
                    value={serviceRadiusKm}
                    onChange={(e) => setServiceRadiusKm(parseInt(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                  <p className="text-[11px] text-stone-500">
                    We will notify your team about donations within this radius.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  Continue to Capacity & Diets <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleCompleteSignup} className="space-y-5">
              {/* Daily Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Daily Capacity (kg)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={2000}
                    required
                    value={dailyCapacityKg}
                    onChange={(e) => setDailyCapacityKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Approx {Math.round(dailyCapacityKg / 0.5)} meals max per day
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Opens
                    </label>
                    <input
                      type="time"
                      value={openFrom}
                      onChange={(e) => setOpenFrom(e.target.value)}
                      className="w-full px-3 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Closes
                    </label>
                    <input
                      type="time"
                      value={openTo}
                      onChange={(e) => setOpenTo(e.target.value)}
                      className="w-full px-3 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Checkboxes: Cold storage & Transport */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer hover:bg-teal-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={hasColdStorage}
                    onChange={(e) => setHasColdStorage(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-stone-800">Has Cold Storage / Fridge</div>
                    <div className="text-[11px] text-stone-500">Allows cooked meals & dairy</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer hover:bg-teal-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={hasOwnTransport}
                    onChange={(e) => setHasOwnTransport(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-stone-800">Has Own Transport / Van</div>
                    <div className="text-[11px] text-stone-500">Pick up independently</div>
                  </div>
                </label>
              </div>

              {/* Accepted Food Categories */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Accepted Food Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(FOOD_CATEGORY_LABELS) as FoodCategory[]).map((cat) => {
                    const active = acceptedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all border ${
                          active
                            ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                            : 'bg-stone-50 text-stone-600 border-stone-300 hover:border-stone-400'
                        }`}
                      >
                        {FOOD_CATEGORY_LABELS[cat]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accepted Diets */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Accepted Diets
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['veg', 'non_veg', 'jain', 'mixed'] as DietType[]).map((diet) => {
                    const active = acceptedDiets.includes(diet);
                    return (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => toggleDiet(diet)}
                        className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all border ${
                          active
                            ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                            : 'bg-stone-50 text-stone-600 border-stone-300 hover:border-stone-400'
                        }`}
                      >
                        {DIET_LABELS[diet]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-3.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Registering NGO...' : 'Complete NGO Registration'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          <div className="text-center pt-2 text-xs text-stone-500">
            Already registered?{' '}
            <Link href="/ngo/login" className="font-bold text-teal-700 hover:underline">
              Sign in to NGO console
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
