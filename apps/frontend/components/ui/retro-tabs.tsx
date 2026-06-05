'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Swiss International Style Tabs Component
 *
 * Design Principles:
 * - Square corners (rounded-none) - Brutalist aesthetic
 * - Hard shadows on active tab
 * - Black borders for high contrast
 * - Monospace uppercase text
 */

export interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface RetroTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const RetroTabs: React.FC<RetroTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <div className={cn('flex gap-1 border-b border-zinc-800', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.disabled;

        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            disabled={isDisabled}
            suppressHydrationWarning
            className={cn(
              'px-5 py-2.5 font-mono text-xs uppercase tracking-wider transition-all duration-200',
              'border border-b-0 border-zinc-800 -mb-px rounded-t-xl',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
              isActive && [
                'bg-zinc-900 text-white font-bold',
                'border-b-zinc-900',
              ],
              !isActive &&
                !isDisabled && ['bg-zinc-950 text-zinc-400 hover:bg-zinc-900 hover:text-white'],
              isDisabled && ['bg-zinc-950/50 text-zinc-600 cursor-not-allowed opacity-50']
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
