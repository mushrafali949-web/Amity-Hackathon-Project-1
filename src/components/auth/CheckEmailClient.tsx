'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Send, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { requestVerificationEmailAction } from '@/lib/actions/auth-email';

export function CheckEmailClient() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    setSentMessage(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('name', 'ResQFood Partner');
    formData.append('role', 'restaurant');

    try {
      const res = await requestVerificationEmailAction(formData);
      if (res.success) {
        toast.success(res.message);
        setSentMessage(res.message || null);
      } else {
        toast.error(res.error || 'Failed to send email');
      }
    } catch {
      toast.error('Network error sending verification');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-4 selection:bg-[#7C3AED] selection:text-white">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-10 border-2 border-stone-200/80 shadow-2xl space-y-6">
        <div className="w-16 h-16 bg-[#FFF7ED] text-[#EA580C] rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-[#FED7AA]">
          <Mail className="w-8 h-8" />
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-[#F3E8FF] text-[#7C3AED] text-xs font-black uppercase px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> Resend API Email Verification
          </div>
          <h1 className="text-3xl font-black text-[#2B1B54] tracking-tight">Verify Your Account</h1>
          <p className="text-[#5A467A] text-sm leading-relaxed max-w-md mx-auto">
            Please verify your email address to activate real-time surplus dispatch and FSSAI safe food alerts.
          </p>
        </div>

        {/* Interactive Resend API verification form */}
        <form onSubmit={handleSendEmail} className="bg-[#FAF5EB] rounded-2xl p-5 border border-[#EADFC7] space-y-3">
          <label className="block text-xs font-black uppercase tracking-wider text-[#2B1B54]">
            Send / Resend Verification Email
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] bg-white text-stone-900"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <span>Sending...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via Resend</span>
                </>
              )}
            </button>
          </div>
          {sentMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{sentMessage}</span>
            </div>
          )}
        </form>

        <div className="bg-stone-50 rounded-2xl p-4 text-xs text-stone-600 border border-stone-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-stone-800">Demo Testing Tip:</span> If email confirmation is disabled in your Supabase dashboard or using seed accounts, you can sign in directly to either portal below without waiting!
          </div>
        </div>

        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/restaurant/login"
            className="py-3 px-4 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
          >
            Restaurant Login <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/ngo/login"
            className="py-3 px-4 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
          >
            NGO / Shelter Login <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
