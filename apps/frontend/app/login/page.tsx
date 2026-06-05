'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/context/auth-context';
import { useTranslations } from '@/lib/i18n';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';

export default function LoginPage() {
  const { t } = useTranslations();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError('');
    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center py-12 px-4">
      <div className="w-full max-w-sm relative">

        {/* Glow ring behind card */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-3xl blur-2xl opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.6) 0%, rgba(34,211,238,0.3) 60%, transparent 100%)' }}
        />

        {/* Glass card */}
        <div className="relative glass rounded-3xl p-8 shadow-2xl" style={{ boxShadow: '0 0 0 1px rgba(99,102,241,0.2), 0 32px 80px rgba(0,0,0,0.5)' }}>

          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2.5 mb-3">
              <Image src="/logo.svg" alt="CareerOS" width={32} height={32} className="w-8 h-8" />
              <span className="font-sans font-black text-2xl tracking-tight text-white">
                Career<span className="gradient-text">OS</span>
              </span>
            </div>
            <h1 className="text-xl font-bold text-white/90">Welcome back</h1>
            <p className="text-sm text-white/40 mt-1">Sign in to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
                {t('auth.email') !== 'auth.email' ? t('auth.email') : 'Email'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 transition-all outline-none focus:ring-2 focus:ring-indigo-500/60"
                style={{ background: 'rgba(10,14,30,0.6)', border: '1px solid rgba(99,102,241,0.25)' }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
                {t('auth.password') !== 'auth.password' ? t('auth.password') : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder-white/20 transition-all outline-none focus:ring-2 focus:ring-indigo-500/60"
                  style={{ background: 'rgba(10,14,30,0.6)', border: '1px solid rgba(99,102,241,0.25)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl font-bold text-sm text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 glow-indigo"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #22d3ee 100%)', backgroundSize: '200% 200%' }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : (t('auth.signIn') !== 'auth.signIn' ? t('auth.signIn') : 'Sign In')}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-white/30">
            No account?{' '}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
