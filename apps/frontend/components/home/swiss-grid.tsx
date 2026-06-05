'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import { useTranslations } from '@/lib/i18n';
import { getButtonClass } from '@/components/ui/button';

export const SwissGrid = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslations();

  return (
    // 1. Outer Wrapper: Fixed height with grid background
    <div
      className="h-screen w-full flex justify-center items-start py-12 px-4 md:px-8 overflow-hidden bg-background"
      style={{
        backgroundImage:
          'radial-gradient(circle at top, rgba(139, 92, 246, 0.06) 0%, transparent 60%), linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 40px 40px, 40px 40px',
      }}
    >
      {/* 2. The Main Container: Subtle borders, creating the premium "Canvas" */}
      <div className="w-full max-w-[86rem] max-h-full border border-zinc-800 bg-zinc-950/60 backdrop-blur-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Section - stays above hovered cards */}
        <div className="border-b border-zinc-800/80 p-8 md:p-12 shrink-0 bg-zinc-900/10 relative z-30">
          <h1 className="font-sans text-4xl md:text-5xl font-extrabold tracking-tight leading-none uppercase bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            {t('nav.dashboard')}
          </h1>
          <p className="mt-4 text-xs font-mono text-violet-400 uppercase tracking-wide max-w-md font-bold">
            {'// '}
            {t('dashboard.selectModule')}
          </p>
        </div>

        {/* Content Grid - Scrollable area with NO padding.
            @container makes the card grid respond to the container's actual
            width, not the viewport. The Swiss frame is max-w-86rem so on
            ultra-wide screens the cards no longer over-stretch. */}
        <div className="@container flex-1 overflow-y-auto overflow-x-hidden relative z-10">
          <div className="p-[1.5px]">
            <div className="grid grid-cols-1 @2xl:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-5 bg-zinc-800/50 gap-[1px] border-b border-zinc-800/80">
              {children}
            </div>
          </div>
        </div>

        {/* Footer - stays above hovered cards */}
        <div className="p-4 bg-zinc-900/30 flex justify-between items-center font-mono text-xs text-zinc-400 border-t border-zinc-800/80 shrink-0 relative z-30">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="CareerOS"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            <span className="uppercase font-bold text-zinc-200">CareerOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/tracker"
              className={getButtonClass('outline', 'default', 'min-w-[140px] gap-2')}
            >
              <LayoutGrid className="w-4 h-4" />
              {t('nav.applicationTracker')}
            </Link>
            <Link
              href="/settings"
              className={getButtonClass('warning', 'default', 'min-w-[140px]')}
            >
              {t('nav.settings')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
