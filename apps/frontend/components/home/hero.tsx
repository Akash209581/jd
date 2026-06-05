'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';
import { getButtonClass } from '@/components/ui/button';

export default function Hero() {
  const { t } = useTranslations();

  return (
    <section
      className="h-screen w-full flex items-center justify-center p-4 md:p-12 lg:p-24 bg-zinc-950 relative overflow-hidden"
      style={{
        backgroundImage:
          'radial-gradient(circle at center, rgba(139, 92, 246, 0.12) 0%, transparent 65%), linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 50px 50px, 50px 50px',
      }}
    >
      {/* Decorative background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-md px-6 py-16 md:py-24 rounded-3xl shadow-2xl text-center">
        {/* Glow effect on container */}
        <div className="absolute inset-0 rounded-3xl border border-white/5 pointer-events-none" />

        <h1 className="mb-4 font-sans text-6xl font-extrabold tracking-tight md:text-8xl lg:text-9xl leading-none select-none bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
          {t('home.brandLine1')}
          <span className="text-zinc-100">{t('home.brandLine2')}</span>
        </h1>

        <p className="mb-12 text-zinc-400 font-sans text-base md:text-lg max-w-xl leading-relaxed">
          The open-source AI-powered resume optimizer and application tracker.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 justify-center">
          <a
            href="https://github.com/career-os/career-os"
            target="_blank"
            rel="noopener noreferrer"
            className={getButtonClass('outline', 'lg')}
          >
            GitHub
          </a>
          <a
            href="https://docs.career-os.dev"
            target="_blank"
            rel="noopener noreferrer"
            className={getButtonClass('outline', 'lg')}
          >
            {t('home.docs')}
          </a>
          <Link href="/dashboard" className={getButtonClass('default', 'lg')}>
            {t('home.launchApp')}
          </Link>
        </div>
      </div>
    </section>
  );
}
