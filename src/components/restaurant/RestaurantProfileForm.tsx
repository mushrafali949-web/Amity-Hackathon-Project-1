'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { updateRestaurantProfileAction } from '@/lib/actions/restaurant';
import { Restaurant } from '@/types/database';
import {
  Building,
  Phone,
  MapPin,
  ShieldCheck,
  Search,
  LocateFixed,
  CheckCircle2,
} from 'lucide-react';

export function RestaurantProfileForm({ restaurant }: { restaurant: Restaurant | null }) {
  const [name, setName] = useState(restaurant?.name || '');
  const [phone, setPhone] = useState(restaurant?.phone || '');
  const [address, setAddress] = useState(restaurant?.address || '');
  const [city, setCity] = useState(restaurant?.city || 'Jaipur');
  const [lat, setLat] = useState(restaurant?.lat || 26.9124);
  const [lng, setLng] = useState(restaurant?.lng || 75.7873);
  const [fssaiLicense, setFssaiLicense] = useState(restaurant?.fssai_license || '');
  const [defaultPickupNotes, setDefaultPickupNotes] = useState(
    restaurant?.default_pickup_notes || ''
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
          // keep
        }
      },
      () => toast.error('Unable to retrieve GPS')
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await updateRestaurantProfileAction({
        name,
        phone,
        address,
        city,
        lat,
        lng,
        fssai_license: fssaiLicense || null,
        default_pickup_notes: defaultPickupNotes || null,
      });

      if (res.success) {
        toast.success('Restaurant profile updated successfully');
      } else {
        toast.error(res.error || 'Failed to update profile');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-md space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Kitchen Profile</h1>
        <p className="text-xs text-stone-500">
          Manage your restaurant details, location coordinates, and licence certification
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            Restaurant / Kitchen Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                FSSAI Licence No. (14 digits)
              </label>
              {fssaiLicense && fssaiLicense.length === 14 && (
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
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Location Update */}
        <div className="space-y-2 pt-2 border-t border-stone-100">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
            Default Pickup Address & Geolocation
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area (e.g. C Scheme, Jaipur)"
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
              {searching ? 'Finding...' : 'Find'}
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
            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />

          <div className="flex items-center gap-3 text-xs text-stone-500">
            <span>City: <strong>{city}</strong></span>
            <span>GPS: <strong>{lat.toFixed(4)}, {lng.toFixed(4)}</strong></span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            Default Pickup Notes for Drivers
          </label>
          <input
            type="text"
            value={defaultPickupNotes}
            onChange={(e) => setDefaultPickupNotes(e.target.value)}
            placeholder="e.g. Service gate on left, ask for Manager"
            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
