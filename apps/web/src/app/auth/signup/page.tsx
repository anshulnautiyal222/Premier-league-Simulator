'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { signUp } from '../actions';
import { Shield, ArrowRight, Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.message) {
        setMessage(result.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#161F30] border border-[#22304A] rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#00FF87]/10 border border-[#00FF87]/30 text-[#00FF87] mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Register as Sporting Director</h1>
          <p className="text-sm text-slate-400 mt-1">
            Found your virtual Premier League club and claim your £100M purse
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs leading-relaxed">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 rounded-lg bg-[#00FF87]/10 border border-[#00FF87]/30 text-[#00FF87] text-xs leading-relaxed">
            {message}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="gaffer@club.com"
              className="w-full px-4 py-2.5 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00FF87] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              className="w-full px-4 py-2.5 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00FF87] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#00FF87] text-black font-bold text-sm hover:bg-[#00e67a] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Continue to Club Founding</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-[#22304A] text-center text-xs text-slate-400">
          Already have a club?{' '}
          <Link href="/auth/login" className="text-[#00FF87] font-semibold hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
