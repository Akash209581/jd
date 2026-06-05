'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/context/auth-context';
import { useTranslations } from '@/lib/i18n';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Check from 'lucide-react/dist/esm/icons/check';

export default function SignupPage() {
  const { t } = useTranslations();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const strengthColor = ['', '#f43f5e', '#fbbf24', '#34d399', '#6366f1'][passwordStrength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    const res = await signup(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center py-12 px-4">
      <div className="w-full max-w-sm relative">

        {/* Glow ring */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-3xl blur-2xl opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(167,139,250,0.6) 0%, rgba(34,211,238,0.3) 60%, transparent 100%)' }}
        />

        {/* Glass card */}
        <div className="relative glass rounded-3xl p-8 shadow-2xl" style={{ boxShadow: '0 0 0 1px rgba(167,139,250,0.2), 0 32px 80px rgba(0,0,0,0.5)' }}>

          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2.5 mb-3">
              <Image src="/logo.svg" alt="CareerOS" width={32} height={32} className="w-8 h-8" />
              <span className="font-sans font-black text-2xl tracking-tight text-white">
                Career<span className="gradient-text">OS</span>
              </span>
            </div>
            <h1 className="text-xl font-bold text-white/90">Create your account</h1>
            <p className="text-sm text-white/40 mt-1">Start your career journey</p>
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
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-violet-500/60 transition-all"
                style={{ background: 'rgba(10,14,30,0.6)', border: '1px solid rgba(167,139,250,0.25)' }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="min. 6 characters"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-violet-500/60 transition-all"
                  style={{ background: 'rgba(10,14,30,0.6)', border: '1px solid rgba(167,139,250,0.25)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength bar */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= passwordStrength ? strengthColor : 'rgba(99,102,241,0.15)' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strengthColor }}>{strengthLabel}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-violet-500/60 transition-all"
                  style={{ background: 'rgba(10,14,30,0.6)', border: '1px solid rgba(167,139,250,0.25)' }}
                />
                {confirmPassword && confirmPassword === password && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl font-bold text-sm text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 50%, #22d3ee 100%)', boxShadow: '0 0 20px rgba(167,139,250,0.35)' }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/30">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
