'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { HeartHandshake, AlertCircle, ArrowRight, ShieldCheck, UtensilsCrossed } from 'lucide-react';

function NgoLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errParam = searchParams.get('error');
    if (errParam === 'role_mismatch_restaurant') {
      setError('This account belongs to a Restaurant. Please sign in via the Restaurant Portal.');
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        const role = data.user.user_metadata?.role;
        if (role === 'restaurant') {
          await supabase.auth.signOut();
          setError('This is a Restaurant account — please use the Restaurant login portal.');
          setLoading(false);
          return;
        }

        router.push('/ngo/console');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail('ngo1@demo.resqfood.app');
    setPassword('Demo@1234');
  }

  return (
    <div className="min-h-screen bg-[#f4fbf9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg transform rotate-2 hover:rotate-0 transition-transform">
            <HeartHandshake className="w-9 h-9" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-black text-stone-900 tracking-tight">
          NGO Operations Console
        </h2>
        <p className="mt-2 text-center text-sm text-stone-600">
          Claim surplus food, dispatch drivers, and feed communities in real time
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl border border-stone-200 rounded-3xl sm:px-10 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span>{error}</span>
                {error.includes('Restaurant') && (
                  <div className="mt-2">
                    <Link
                      href="/restaurant/login"
                      className="font-bold text-orange-600 underline hover:text-orange-800 inline-flex items-center gap-1"
                    >
                      Go to Restaurant Login <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Official Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="relief@foodbank.org"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-teal-700 hover:text-teal-900 font-semibold"
                >
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl shadow-lg bg-teal-600 hover:bg-teal-700 text-white font-black text-sm tracking-wide transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Accessing Console...' : 'Access NGO Console'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Bar */}
          <div className="pt-2 border-t border-stone-100 text-center">
            <button
              type="button"
              onClick={fillDemo}
              className="w-full py-2.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-teal-600" /> Autofill Demo NGO (Jaipur Relief)
            </button>
          </div>

          <div className="text-center pt-2 text-sm text-stone-600">
            Represent a shelter or non-profit?{' '}
            <Link
              href="/ngo/signup"
              className="font-bold text-teal-700 hover:text-teal-800 underline"
            >
              Register your organization
            </Link>
          </div>

          <div className="text-center pt-1">
            <Link
              href="/restaurant/login"
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-orange-600 font-medium"
            >
              <UtensilsCrossed className="w-4 h-4" /> Are you a Restaurant? Switch to Donor portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NgoLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4fbf9] flex items-center justify-center">Loading...</div>}>
      <NgoLoginForm />
    </Suspense>
  );
}
