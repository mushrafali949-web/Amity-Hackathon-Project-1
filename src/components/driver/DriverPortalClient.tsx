'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { verifyDriverOtpAction, driverMarkDeliveredAction } from '@/lib/actions/driver';
import { DynamicDriverMap } from './DynamicDriverMap';
import { formatCountdown } from '@/lib/utils';
import { FOOD_CATEGORY_LABELS, DIET_LABELS } from '@/lib/config';
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  KeyRound,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface DriverPortalClientProps {
  token: string;
  dispatch: any;
  donation: any;
  restaurant: any;
  ngo: any;
  privateDetails: any;
  routeCoordinates: [number, number][];
  routeDistanceKm: number;
  routeDurationMin: number;
}

export function DriverPortalClient({
  token,
  dispatch,
  donation,
  restaurant,
  ngo,
  privateDetails,
  routeCoordinates,
  routeDistanceKm,
  routeDurationMin,
}: DriverPortalClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(donation.status);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const countdown = formatCountdown(donation.safe_until);
  const pickupAddress = privateDetails?.pickup_address || restaurant?.address;
  const restaurantPhone = privateDetails?.contact_phone || restaurant?.phone;
  const ngoPhone = ngo?.phone;

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 4) {
      toast.error('Handover OTP must be 4 digits');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyDriverOtpAction({ token, otp });
      if (res.success) {
        toast.success('OTP Verified! Food handover confirmed.');
        setStatus('picked_up');
        router.refresh();
      } else {
        toast.error(res.error || 'Incorrect OTP');
      }
    } catch {
      toast.error('Error verifying OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkDelivered() {
    setLoading(true);
    try {
      const res = await driverMarkDeliveredAction(token);
      if (res.success) {
        toast.success('Food delivered to shelter! Receipt logged.');
        setStatus('delivered');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to update delivery');
      }
    } catch {
      toast.error('Error recording delivery');
    } finally {
      setLoading(false);
    }
  }

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    pickupAddress
  )}&destination=${encodeURIComponent(ngo?.address || '')}`;

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto space-y-6">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-sm tracking-tight text-white">ResQFood Driver</div>
            <div className="text-[10px] text-stone-400">
              {dispatch.is_self_pickup ? 'NGO Volunteer Team' : dispatch.driver_name || 'Driver'}
            </div>
          </div>
        </div>

        <span
          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
            status === 'delivered'
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : status === 'picked_up'
              ? 'bg-blue-950 text-blue-400 border border-blue-800'
              : 'bg-amber-950 text-amber-400 border border-amber-800'
          }`}
        >
          {status === 'delivered'
            ? 'Delivered'
            : status === 'picked_up'
            ? 'In Transit'
            : 'Pending Pickup'}
        </span>
      </div>

      {/* Food Details Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-3 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
              {FOOD_CATEGORY_LABELS[donation.category as keyof typeof FOOD_CATEGORY_LABELS] || donation.category} •{' '}
              {DIET_LABELS[donation.diet] || donation.diet}
            </span>
            <h1 className="text-xl font-black text-white mt-0.5">{donation.title}</h1>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-orange-500">{donation.quantity_kg} kg</div>
            <div className="text-[11px] text-stone-400">
              ~{donation.servings || Math.round(donation.quantity_kg / 0.5)} meals
            </div>
          </div>
        </div>

        {/* Expiry Countdown */}
        <div className="p-3 bg-stone-950 rounded-2xl flex items-center justify-between text-xs border border-stone-800">
          <span className="text-stone-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-orange-500" /> Safe window:
          </span>
          <span
            className={`font-black ${
              countdown.isExpired ? 'text-red-400' : 'text-stone-200'
            }`}
          >
            {countdown.formatted}
          </span>
        </div>
      </div>

      {/* Route & Locations Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4 shadow-lg text-xs">
        {/* Step A: Pickup */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-orange-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
            A
          </div>
          <div className="flex-1 space-y-1">
            <div className="font-bold text-stone-300">Pickup Kitchen (Donor)</div>
            <div className="font-black text-white text-sm">{restaurant?.name}</div>
            <div className="text-stone-400 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
              <span>{pickupAddress}</span>
            </div>
            {restaurantPhone && (
              <a
                href={`tel:${restaurantPhone}`}
                className="inline-flex items-center gap-1 font-bold text-orange-400 hover:underline pt-1"
              >
                <Phone className="w-3 h-3" /> Call Restaurant: {restaurantPhone}
              </a>
            )}
          </div>
        </div>

        <div className="border-l-2 border-dashed border-stone-700 ml-3 h-4" />

        {/* Step B: Destination */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
            B
          </div>
          <div className="flex-1 space-y-1">
            <div className="font-bold text-stone-300">Destination Shelter (Recipient)</div>
            <div className="font-black text-white text-sm">{ngo?.name}</div>
            <div className="text-stone-400 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
              <span>{ngo?.address}, {ngo?.city}</span>
            </div>
            {ngoPhone && (
              <a
                href={`tel:${ngoPhone}`}
                className="inline-flex items-center gap-1 font-bold text-teal-400 hover:underline pt-1"
              >
                <Phone className="w-3 h-3" /> Call NGO: {ngoPhone}
              </a>
            )}
          </div>
        </div>

        {/* Navigation Shortcut */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors border border-stone-700"
        >
          <Navigation className="w-3.5 h-3.5 text-orange-400" /> Open Turn-by-Turn Navigation (Google Maps)
        </a>
      </div>

      {/* Map with Route Polyline */}
      <div className="h-56 w-full">
        <DynamicDriverMap
          startLat={privateDetails?.pickup_lat || donation.approx_lat}
          startLng={privateDetails?.pickup_lng || donation.approx_lng}
          endLat={ngo?.lat || 26.9085}
          endLng={ngo?.lng || 75.792}
          restaurantName={restaurant?.name || 'Restaurant'}
          ngoName={ngo?.name || 'NGO'}
          routeCoordinates={routeCoordinates}
        />
      </div>

      {/* ACTION STEP CONTAINER */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl">
        {status === 'matched' ? (
          /* STEP 1: ENTER HANDOVER OTP */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-white flex items-center justify-center gap-2">
                <KeyRound className="w-4 h-4 text-orange-500" /> Enter Handover OTP
              </h3>
              <p className="text-[11px] text-stone-400">
                Ask the restaurant chef/manager for their 4-digit pickup code
              </p>
            </div>

            <div className="flex justify-center">
              <input
                type="text"
                maxLength={4}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-48 text-center text-3xl font-mono font-black tracking-widest px-4 py-3 bg-stone-950 border-2 border-orange-500 rounded-2xl text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 4}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm rounded-2xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying OTP...' : 'Verify OTP & Confirm Pickup'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : status === 'picked_up' ? (
          /* STEP 2: MARK AS DELIVERED */
          <div className="space-y-4 text-center">
            <div className="space-y-1">
              <h3 className="font-black text-base text-white flex items-center justify-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" /> Food In Transit
              </h3>
              <p className="text-[11px] text-stone-400">
                Drive carefully to {ngo?.name}. Tap below when arrived at shelter.
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleMarkDelivered}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Logging Delivery...' : 'Confirm Delivered at NGO'}
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* STEP 3: COMPLETED */
          <div className="text-center space-y-2 py-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="font-black text-lg text-white">Rescue Mission Accomplished!</h3>
            <p className="text-xs text-stone-400">
              The NGO team is verifying weight and serving meals to community members. Thank you!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
