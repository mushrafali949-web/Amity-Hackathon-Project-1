'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { demoVerifyNgoAction } from '@/lib/actions/ngo';
import {
  Building2,
  ShieldCheck,
  Clock,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export function NgoProfileClient({ ngo }: { ngo: any }) {
  const [verifying, setVerifying] = useState(false);
  const isVerified = ngo?.verification_status === 'verified';

  async function handleQuickVerify() {
    setVerifying(true);
    try {
      const res = await demoVerifyNgoAction();
      if (res.success) {
        toast.success('NGO Verified! You can now claim surplus food.');
      } else {
        toast.error('Failed to update verification status');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          Organization Profile
        </h1>
        <p className="text-xs text-stone-500">
          Official registration and verification status with ResQFood
        </p>
      </div>

      {/* Verification Status Card */}
      <div
        className={`p-6 rounded-3xl border shadow-xs space-y-4 ${
          isVerified
            ? 'bg-emerald-50/70 border-emerald-200'
            : 'bg-amber-50/70 border-amber-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isVerified ? (
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="text-sm font-black text-stone-900">
                {isVerified ? 'Verified Non-Profit Partner' : 'Verification Under Review'}
              </div>
              <div className="text-xs text-stone-600">
                Status:{' '}
                <span className="font-bold uppercase tracking-wider">
                  {ngo?.verification_status || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {!isVerified && (
            <button
              type="button"
              disabled={verifying}
              onClick={handleQuickVerify}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {verifying ? 'Verifying...' : 'Verify Now (Demo)'}
            </button>
          )}
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          {isVerified
            ? 'Your organization is authenticated and eligible to claim surplus food, receive driver dispatches, and issue certified donation receipts.'
            : 'Pending accounts can review the live feed and configure team capacities. To claim food donations, an account must be verified.'}
        </p>
      </div>

      {/* Details Summary Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4 text-xs">
        <h2 className="text-sm font-black text-stone-900 uppercase tracking-wider mb-2">
          Registration Particulars
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-stone-50 rounded-xl space-y-0.5">
            <span className="text-stone-400 font-medium">Organization Name</span>
            <div className="font-bold text-stone-900 text-sm">{ngo?.name}</div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl space-y-0.5">
            <span className="text-stone-400 font-medium">Registration / NGO Darpan ID</span>
            <div className="font-bold text-stone-900 text-sm">
              {ngo?.registration_no || 'Not Specified'}
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl space-y-0.5">
            <span className="text-stone-400 font-medium">Operations Contact Person</span>
            <div className="font-bold text-stone-900 text-sm">
              {ngo?.contact_person || 'Operations Head'}
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl space-y-0.5">
            <span className="text-stone-400 font-medium">Official Contact Phone</span>
            <div className="font-bold text-stone-900 text-sm">{ngo?.phone || 'Confidential'}</div>
          </div>
        </div>

        <div className="p-3 bg-stone-50 rounded-xl space-y-1">
          <span className="text-stone-400 font-medium">Base Dispatch Address</span>
          <div className="font-bold text-stone-900 flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
            <span>
              {ngo?.address}, {ngo?.city}
            </span>
          </div>
          <div className="text-[11px] text-stone-400 pt-1">
            GPS: {ngo?.lat?.toFixed(4)}, {ngo?.lng?.toFixed(4)} • Service Radius:{' '}
            {ngo?.service_radius_km} km
          </div>
        </div>

        <div className="p-3 bg-stone-50 rounded-xl space-y-0.5">
          <span className="text-stone-400 font-medium">Daily People Served</span>
          <div className="font-bold text-stone-900 text-sm">
            ~{ngo?.people_served_daily || 100} individuals daily
          </div>
        </div>
      </div>
    </div>
  );
}
