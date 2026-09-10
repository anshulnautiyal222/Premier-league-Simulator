'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { signIn, signInDemo } from '../actions';
import { Shield, ArrowRight, Loader2, Zap } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDemoPending, startDemoTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signIn(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleDemoLogin = () => {
    setError(null);
    startDemoTransition(async () => {
      await signInDemo();
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#161F30] border border-[#22304A] rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#00FF87]/10 border border-[#00FF87]/30 text-[#00FF87] mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sporting Director Login</h1>
          <p className="text-sm text-slate-400 mt-1">
            Access your transfer desk, £100M purse, and club roster
          </p>
        </div>

        {/* 1-Click Instant Demo Login Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isDemoPending || isPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#00FF87] text-black font-extrabold text-sm hover:bg-[#00e67a] active:scale-[0.99] transition-all shadow-lg shadow-[#00FF87]/20 disabled:opacity-50"
          >
            {isDemoPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Entering Boardroom...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-black" />
                <span>1-Click Instant Demo Login</span>
              </>
            )}
          </button>
          <div className="text-[11px] text-center text-slate-400 mt-1.5">
            Instant entry — no email confirmation or password required
          </div>
        </div>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#22304A]" />
          </div>
          <span className="relative bg-[#161F30] px-3 text-[11px] uppercase font-mono text-slate-400">
            Or sign in with email
          </span>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs leading-relaxed">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              defaultValue="gaffer@club.com"
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
              defaultValue="password123"
              placeholder="Your password"
              className="w-full px-4 py-2.5 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00FF87] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || isDemoPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#111827] border border-[#22304A] text-white font-bold text-sm hover:border-[#00FF87] hover:text-[#00FF87] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In with Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 pt-5 border-t border-[#22304A] text-center text-xs text-slate-400">
          Don&apos;t have a club yet?{' '}
          <Link href="/auth/signup" className="text-[#00FF87] font-semibold hover:underline">
            Register & Found Club
          </Link>
        </div>
      </div>
    </div>
  );
}
