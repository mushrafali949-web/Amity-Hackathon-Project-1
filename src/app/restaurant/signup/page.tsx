'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  UtensilsCrossed,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ShieldCheck,
  Search,
  LocateFixed,
} from 'lucide-react';

export default function RestaurantSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: User & Owner Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Restaurant Profile & Location
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('MI Road, C Scheme');
  const [city, setCity] = useState('Jaipur');
  const [lat, setLat] = useState(26.9157);
  const [lng, setLng] = useState(75.8042);
  const [fssaiLicense, setFssaiLicense] = useState('');
  const [defaultPickupNotes, setDefaultPickupNotes] = useState('Pickup from kitchen backdoor, ask for Head Chef');

  // Address search query & results
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  function validateStep1() {
    if (!email || !password || !fullName || !phone) {
      setError('Please fill in all account fields');
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
    if (!restaurantName || !address || !city) {
      setError('Please enter restaurant name, address, and city');
      return false;
    }
    if (fssaiLicense) {
      const cleanFssai = fssaiLicense.trim();
      if (!/^\d{14}$/.test(cleanFssai)) {
        setError('FSSAI Licence must be exactly 14 digits (or leave blank if pending)');
        return false;
      }
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

  async function handleCompleteSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep2()) return;

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
            role: 'restaurant',
            full_name: fullName,
            phone,
            restaurant_name: restaurantName,
            address,
            city,
            lat,
            lng,
            fssai_license: fssaiLicense || null,
            default_pickup_notes: defaultPickupNotes || null,
          },
          emailRedirectTo: `${origin}/auth/callback?role=restaurant`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // If user returned with an active session immediately (e.g. email confirm off)
      if (data.session) {
        router.push('/restaurant/dashboard');
      } else {
        router.push('/auth/check-email');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fcf9f2] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-orange-500 text-white items-center justify-center shadow-lg mb-3">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-stone-900">Register Your Restaurant</h1>
          <p className="text-sm text-stone-600 mt-1">
            Step {step} of 2: {step === 1 ? 'Account Credentials' : 'Kitchen Details & Location'}
          </p>

          {/* Stepper Bar */}
          <div className="w-full bg-stone-200 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-orange-500 h-full transition-all duration-300"
              style={{ width: step === 1 ? '50%' : '100%' }}
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
                  Owner / Manager Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Chef Vikram Sharma"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98290 12345"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@royalrasoi.com"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Account Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  Continue to Kitchen Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleCompleteSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Restaurant / Kitchen Name
                </label>
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Royal Spice Haveli"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Jaipur"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      FSSAI Licence No. (14 digits)
                    </label>
                    {fssaiLicense.length === 14 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Licence added
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={14}
                    value={fssaiLicense}
                    onChange={(e) => setFssaiLicense(e.target.value)}
                    placeholder="12214012000123"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Geocoded Address & Pin Drop */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Pickup Location & Address
                </label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search area (e.g. C-Scheme, Jaipur)"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                    title="Use Current GPS"
                    className="p-2 border border-stone-300 hover:bg-stone-100 rounded-lg text-stone-700"
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
                          setAddress(res.display_name);
                          setCity(res.city);
                          setLat(res.lat);
                          setLng(res.lng);
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
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address for driver pickup"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />

                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span className="font-semibold text-stone-700">GPS:</span> {lat.toFixed(4)}, {lng.toFixed(4)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Default Pickup Notes
                </label>
                <input
                  type="text"
                  value={defaultPickupNotes}
                  onChange={(e) => setDefaultPickupNotes(e.target.value)}
                  placeholder="e.g. Park near service lane, ask for Manager"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
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
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          <div className="text-center pt-2 text-xs text-stone-500">
            Already registered?{' '}
            <Link href="/restaurant/login" className="font-bold text-orange-600 hover:underline">
              Sign in to kitchen portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
