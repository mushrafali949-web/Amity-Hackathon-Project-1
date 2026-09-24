'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { cancelDonationAction } from '@/lib/actions/donation';
import { formatTimeAgo, formatCountdown } from '@/lib/utils';
import { FOOD_CATEGORY_LABELS, DIET_LABELS } from '@/lib/config';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  Phone,
  Truck,
  FileText,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  ArrowLeft,
  MapPin,
} from 'lucide-react';

export function DonationTrackerClient({ initialDonation }: { initialDonation: any }) {
  const router = useRouter();
  const [donation, setDonation] = useState(initialDonation);
  const [cancelling, setCancelling] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Subscribe to real-time status updates on this donation
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`donation-tracker-${donation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'donations',
          filter: `id=eq.${donation.id}`,
        },
        async () => {
          // Re-fetch updated full donation record with joined tables
          const { data } = await supabase
            .from('donations')
            .select('*, donation_private(*), ngos(*), dispatches(*), donation_offers(count)')
            .eq('id', donation.id)
            .single();

          if (data) {
            setDonation(data);
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [donation.id, router]);

  const stages = [
    { key: 'posted', label: 'Surplus Posted', desc: 'Matching nearby NGOs' },
    { key: 'matched', label: 'Claimed by NGO', desc: 'Pickup coordinated' },
    { key: 'picked_up', label: 'Picked Up', desc: 'In transit with driver' },
    { key: 'delivered', label: 'Delivered', desc: 'Meals served safely' },
  ];

  const currentStageIndex =
    donation.status === 'delivered'
      ? 3
      : donation.status === 'picked_up'
      ? 2
      : donation.status === 'matched'
      ? 1
      : donation.status === 'posted'
      ? 0
      : -1; // cancelled or expired

  const countdown = formatCountdown(donation.safe_until);
  const offersCount = donation.donation_offers?.[0]?.count ?? 0;
  const otp = donation.donation_private?.pickup_otp;

  function handleCopyOtp() {
    if (!otp) return;
    navigator.clipboard.writeText(otp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
    toast.success('Pickup OTP copied to clipboard');
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel this donation?')) return;
    setCancelling(true);
    try {
      const res = await cancelDonationAction(donation.id);
      if (res.success) {
        toast.success('Donation cancelled');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to cancel donation');
      }
    } catch {
      toast.error('Failed to cancel donation');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Breadcrumb & Status Tag */}
      <div className="flex items-center justify-between">
        <Link
          href="/restaurant/donations"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tracker
        </Link>

        <span
          className={`text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider ${
            donation.status === 'delivered'
              ? 'bg-emerald-100 text-emerald-800'
              : donation.status === 'picked_up'
              ? 'bg-blue-100 text-blue-800'
              : donation.status === 'matched'
              ? 'bg-teal-100 text-teal-800 animate-pulse'
              : donation.status === 'posted'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          Status: {donation.status}
        </span>
      </div>

      {/* Main Donation Info Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-semibold">
                {FOOD_CATEGORY_LABELS[donation.category as keyof typeof FOOD_CATEGORY_LABELS] || donation.category}
              </span>
              <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-semibold">
                {DIET_LABELS[donation.diet] || donation.diet}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {donation.title}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Posted {formatTimeAgo(donation.created_at)}
            </p>
          </div>

          <div className="sm:text-right">
            <div className="text-3xl font-black text-orange-600">{donation.quantity_kg} kg</div>
            <div className="text-xs text-stone-500">
              ~{donation.servings || Math.round(donation.quantity_kg / 0.5)} meals
            </div>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        {currentStageIndex >= 0 ? (
          <div className="py-6 border-y border-stone-100">
            <div className="grid grid-cols-4 gap-2 text-center">
              {stages.map((stage, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={stage.key} className="flex flex-col items-center space-y-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-orange-600 text-white ring-4 ring-orange-100 scale-105'
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                    </div>
                    <div>
                      <div
                        className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-orange-600'
                            : isPassed
                            ? 'text-stone-900'
                            : 'text-stone-400'
                        }`}
                      >
                        {stage.label}
                      </div>
                      <div className="hidden sm:block text-[10px] text-stone-400 mt-0.5">
                        {stage.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>
              This donation is marked as <strong>{donation.status}</strong>.
            </span>
          </div>
        )}

        {/* PROMINENT PICKUP OTP BOX (Crucial for Restaurant handover verification) */}
        {otp && donation.status !== 'cancelled' && donation.status !== 'expired' && (
          <div className="p-6 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/5 border-2 border-orange-200 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-orange-600" /> Physical Handover Verification
              </span>
              <span className="text-[11px] text-orange-800 font-medium">Keep ready for driver</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-orange-200 shadow-sm">
              <div>
                <div className="text-xs text-stone-500">Your Secure 4-Digit Pickup OTP:</div>
                <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-stone-900 mt-1">
                  {otp}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyOtp}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                {copiedOtp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedOtp ? 'Copied!' : 'Copy OTP'}
              </button>
            </div>
            <p className="text-[11px] text-orange-900/80 leading-relaxed">
              When the driver or NGO volunteer arrives, verify their identity and give them this 4-digit
              code. Entering this OTP in their driver app verifies successful physical handover.
            </p>
          </div>
        )}

        {/* Claimed NGO Card (Revealed after match) */}
        {donation.ngos && (
          <div className="p-6 bg-teal-50 border border-teal-200 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-teal-600" /> Matched Recipient Organization
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                Verified Partner
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-stone-900">{donation.ngos.name}</h3>
              <p className="text-xs text-stone-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                {donation.ngos.address}, {donation.ngos.city}
              </p>
              {donation.ngos.phone && (
                <p className="text-xs text-teal-800 font-bold flex items-center gap-1 pt-1">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <a href={`tel:${donation.ngos.phone}`} className="hover:underline">
                    {donation.ngos.phone}
                  </a>
                </p>
              )}
            </div>

            {/* Dispatch / Driver details if assigned */}
            {donation.dispatches && (
              <div className="pt-3 border-t border-teal-200/60 flex items-center justify-between text-xs">
                <span className="text-teal-900 font-medium flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-teal-700" />
                  {donation.dispatches.is_self_pickup
                    ? 'NGO Team Self-Pickup'
                    : `Driver: ${donation.dispatches.driver_name || 'Assigned Driver'}`}
                </span>
                {donation.dispatches.driver_phone && (
                  <a
                    href={`tel:${donation.dispatches.driver_phone}`}
                    className="font-bold text-teal-800 hover:underline"
                  >
                    Call Driver ({donation.dispatches.driver_phone})
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Offer broadcast info when still posted */}
        {donation.status === 'posted' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
            <span>
              Notified <strong>{offersCount} nearby verified NGOs</strong> via real-time console &
              SMS.
            </span>
            <span className="font-bold text-orange-600">Awaiting claim</span>
          </div>
        )}

        {/* Safe window countdown & pickup location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <span className="text-stone-500 font-medium">Safe Until Countdown:</span>
            <div className={`text-base font-black ${countdown.isExpired ? 'text-red-600' : 'text-stone-900'}`}>
              {countdown.formatted}
            </div>
            <div className="text-[11px] text-stone-400">
              Expiry:{' '}
              {new Date(donation.safe_until).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
            <span className="text-stone-500 font-medium">Your Pickup Location:</span>
            <div className="text-stone-900 font-bold truncate">
              {donation.donation_private?.pickup_address || donation.area_label}
            </div>
            <div className="text-[11px] text-stone-400">
              Contact: {donation.donation_private?.contact_phone || 'Kitchen phone'}
            </div>
          </div>
        </div>

        {/* Delivered receipt banner */}
        {donation.status === 'delivered' && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="text-emerald-900">
              <strong>Donation Complete!</strong> Verified weight:{' '}
              <strong>{donation.actual_kg_received ?? donation.quantity_kg} kg</strong>.
            </div>
            <Link
              href={`/api/receipt/${donation.id}`}
              target="_blank"
              className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 hover:bg-emerald-800"
            >
              <FileText className="w-3.5 h-3.5" /> Download Tax Receipt
            </Link>
          </div>
        )}

        {/* Cancellation button if posted or matched */}
        {(donation.status === 'posted' || donation.status === 'matched') && (
          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <button
              type="button"
              disabled={cancelling}
              onClick={handleCancel}
              className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {cancelling ? 'Cancelling...' : 'Cancel Donation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
