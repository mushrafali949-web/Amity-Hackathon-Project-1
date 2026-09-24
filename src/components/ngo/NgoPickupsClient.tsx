'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { assignDriverAction, confirmReceiptAction } from '@/lib/actions/ngo';
import { formatTimeAgo, formatCountdown } from '@/lib/utils';
import {
  Truck,
  MapPin,
  Phone,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  ShieldCheck,
  Scale,
  ExternalLink,
} from 'lucide-react';

interface NgoPickupsClientProps {
  ngo: any;
  initialDonations: any[];
  highlightId?: string;
}

export function NgoPickupsClient({
  ngo,
  initialDonations,
  highlightId,
}: NgoPickupsClientProps) {
  const router = useRouter();
  const [donations, setDonations] = useState(initialDonations);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // Form states for driver assignment
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [isSelfPickup, setIsSelfPickup] = useState(true);
  const [savingDriver, setSavingDriver] = useState(false);

  // Form states for confirming delivery receipt
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actualKg, setActualKg] = useState<number>(0);
  const [savingReceipt, setSavingReceipt] = useState(false);

  // Copied token map
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  async function handleAssignDriver(donationId: string) {
    setSavingDriver(true);
    try {
      const res = await assignDriverAction({
        donationId,
        driverName: isSelfPickup ? 'NGO Internal Team' : driverName,
        driverPhone: isSelfPickup ? undefined : driverPhone,
        isSelfPickup,
      });

      if (res.success) {
        toast.success('Dispatch generated! You can now share the driver link.');
        setAssigningId(null);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to dispatch driver');
      }
    } catch {
      toast.error('Failed to assign driver');
    } finally {
      setSavingDriver(false);
    }
  }

  async function handleConfirmReceipt(donationId: string) {
    if (actualKg <= 0) {
      toast.error('Please enter valid actual kg received');
      return;
    }

    setSavingReceipt(true);
    try {
      const res = await confirmReceiptAction({
        donationId,
        actualKgReceived: actualKg,
      });

      if (res.success) {
        toast.success('Delivery Confirmed! Rescued food logged into certified impact.');
        setConfirmingId(null);
        router.push('/ngo/impact');
      } else {
        toast.error(res.error || 'Failed to confirm receipt');
      }
    } catch {
      toast.error('Failed to confirm receipt');
    } finally {
      setSavingReceipt(false);
    }
  }

  function copyDriverLink(token: string) {
    const origin = window.location.origin;
    const url = `${origin}/driver/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success('Driver navigation link copied');
  }

  function getWhatsAppShareUrl(token: string, donationTitle: string, address: string) {
    const origin = window.location.origin;
    const link = `${origin}/driver/${token}`;
    const text = `Hi, please collect surplus food rescue: "${donationTitle}". Pickup address: ${address}. Open driver navigation & enter handover OTP: ${link}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          Active Pickups & Driver Dispatches
        </h1>
        <p className="text-xs text-stone-500">
          Manage driver routes, physical OTP pickup coordination, and final delivery verification
        </p>
      </div>

      {donations.length > 0 ? (
        <div className="space-y-6">
          {donations.map((d) => {
            const isHighlighted = d.id === highlightId;
            const dispatch = d.dispatches;
            const hasDriver = Boolean(dispatch?.token);
            const isPickedUp = d.status === 'picked_up';
            const countdown = formatCountdown(d.safe_until);

            const pickupAddress =
              d.donation_private?.pickup_address ||
              d.restaurants?.address ||
              'Pickup address on file';
            const contactPhone =
              d.donation_private?.contact_phone || d.restaurants?.phone;

            return (
              <div
                key={d.id}
                className={`bg-white rounded-3xl p-6 border shadow-sm space-y-6 transition-all ${
                  isHighlighted ? 'border-teal-500 ring-2 ring-teal-100' : 'border-stone-200'
                }`}
              >
                {/* Header status & title */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          isPickedUp
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {isPickedUp ? 'In Transit to Shelter' : 'Awaiting Collection'}
                      </span>
                      <span className="text-xs text-stone-400">
                        Claimed {formatTimeAgo(d.matched_at || d.created_at)}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-stone-900 mt-1">{d.title}</h2>
                    <p className="text-xs text-stone-500">Donor: {d.restaurants?.name}</p>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-2xl font-black text-teal-700">{d.quantity_kg} kg</div>
                    <div className="text-xs text-stone-500">
                      ~{d.servings || Math.round(d.quantity_kg / 0.5)} meals
                    </div>
                  </div>
                </div>

                {/* REVEALED EXACT PICKUP DETAILS */}
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-teal-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" /> Verified Donor Pickup Details
                    </span>
                    <span className="text-[11px] text-teal-700">Unlocked Post-Claim</span>
                  </div>

                  <div className="text-xs space-y-1 text-stone-700">
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <strong className="text-stone-900">{pickupAddress}</strong>
                    </p>
                    {contactPhone && (
                      <p className="flex items-center gap-1.5 pt-1 text-stone-600">
                        <Phone className="w-4 h-4 text-teal-700 shrink-0" />
                        <span>Donor Contact: </span>
                        <a
                          href={`tel:${contactPhone}`}
                          className="font-bold text-teal-800 underline hover:text-teal-950"
                        >
                          {contactPhone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* DRIVER DISPATCH SECTION */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-orange-600" /> Driver & Pickup Logistics
                    </span>

                    {hasDriver && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Dispatch Active
                      </span>
                    )}
                  </div>

                  {hasDriver ? (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-600">Assigned:</span>
                        <span className="font-bold text-stone-900">
                          {dispatch.is_self_pickup
                            ? 'NGO Team Self-Pickup'
                            : `${dispatch.driver_name} (${dispatch.driver_phone || 'No phone'})`}
                        </span>
                      </div>

                      {/* Driver Link & WhatsApp Share */}
                      <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-2">
                        <div className="text-[11px] text-stone-500 font-medium">
                          Share this link with your driver (no login required):
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => copyDriverLink(dispatch.token)}
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-stone-300"
                          >
                            {copiedToken === dispatch.token ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-stone-600" />
                            )}
                            {copiedToken === dispatch.token ? 'Copied Link' : 'Copy Driver Link'}
                          </button>

                          <a
                            href={getWhatsAppShareUrl(dispatch.token, d.title, pickupAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Share via WhatsApp
                          </a>

                          <Link
                            href={`/driver/${dispatch.token}`}
                            target="_blank"
                            className="ml-auto text-xs text-teal-700 hover:underline font-bold flex items-center gap-1"
                          >
                            Open Driver View <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : assigningId === d.id ? (
                    <div className="space-y-3 p-3 bg-white rounded-xl border border-stone-200">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsSelfPickup(true)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                            isSelfPickup
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-stone-50 text-stone-600 border-stone-200'
                          }`}
                        >
                          We&apos;ll Pick Up Ourselves
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSelfPickup(false)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                            !isSelfPickup
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-stone-50 text-stone-600 border-stone-200'
                          }`}
                        >
                          Assign Driver / Volunteer
                        </button>
                      </div>

                      {!isSelfPickup && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <input
                            type="text"
                            placeholder="Driver / Volunteer Name"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                          />
                          <input
                            type="tel"
                            placeholder="Driver Phone Number"
                            value={driverPhone}
                            onChange={(e) => setDriverPhone(e.target.value)}
                            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setAssigningId(null)}
                          className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={savingDriver}
                          onClick={() => handleAssignDriver(d.id)}
                          className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs"
                        >
                          {savingDriver ? 'Saving...' : 'Confirm Dispatch'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAssigningId(d.id);
                        setIsSelfPickup(true);
                      }}
                      className="w-full py-2 px-3 bg-white hover:bg-stone-100 text-stone-800 rounded-xl text-xs font-bold border border-stone-300 flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <User className="w-3.5 h-3.5" /> Assign Driver or Choose Self-Pickup
                    </button>
                  )}
                </div>

                {/* CONFIRM DELIVERY & WEIGHT RECEIPT SECTION */}
                <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-stone-500">
                    Once the food arrives at your facility, confirm receipt to log verified impact.
                  </div>

                  {confirmingId === d.id ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-semibold text-stone-700">Actual kg:</span>
                        <input
                          type="number"
                          step={0.5}
                          min={0.5}
                          value={actualKg}
                          onChange={(e) => setActualKg(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold text-center"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={savingReceipt}
                        onClick={() => handleConfirmReceipt(d.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs"
                      >
                        {savingReceipt ? 'Saving...' : 'Save & Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="text-xs text-stone-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingId(d.id);
                        setActualKg(d.quantity_kg);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Scale className="w-4 h-4" /> Confirm Receipt (Delivered)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-3xl border border-stone-200 text-center space-y-3">
          <Truck className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No active claimed pickups</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            When you claim surplus food from the Console or Live Feed, your active pickup coordinates
            and driver links will appear here.
          </p>
          <Link
            href="/ngo/console"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
          >
            Go to Command Console
          </Link>
        </div>
      )}
    </div>
  );
}
