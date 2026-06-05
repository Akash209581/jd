import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Swiss International Style Button Component
 *
 * Design Principles:
 * - Hard shadows (no blur) that create depth
 * - Square corners (rounded-none) - Brutalist aesthetic
 * - High contrast black borders
 * - Hover: translate + shadow removal creates "press" effect
 * - Clear semantic variants for different actions
 */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant determining color and purpose:
   * - `default`: Hyper Blue (#1D4ED8) - Primary actions (save, submit, create)
   * - `destructive`: Alert Red (#DC2626) - Destructive actions (delete, remove)
   * - `success`: Signal Green (#15803D) - Positive actions (download, confirm, complete)
   * - `warning`: Alert Orange (#F97316) - Caution actions (reset, clear, undo)
   * - `outline`: Transparent + black border - Secondary actions (cancel, back)
   * - `secondary`: Panel Grey (#E5E5E0) - Tertiary actions
   * - `ghost`: No background - Subtle actions (icon buttons, navigation)
   * - `link`: Text only with underline - Inline links
   */
  variant?:
    | 'default'
    | 'destructive'
    | 'success'
    | 'warning'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  /**
   * Button size:
   * - `default`: Standard button (h-10)
   * - `sm`: Small button (h-8)
   * - `lg`: Large button (h-12)
   * - `icon`: Square icon button (h-9 w-9)
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const iconHitArea = "before:absolute before:-inset-1.5 before:content-['']";

// Variant styles - each has distinct purpose and color
const variants = {
  // PRIMARY - Violet to Indigo Gradient
  default: cn(
    'bg-gradient-to-r from-violet-600 to-indigo-600 text-white',
    'border border-zinc-700/50',
    'shadow-lg shadow-violet-500/10',
    'hover:from-violet-500 hover:to-indigo-500',
    'hover:-translate-y-[1px] hover:shadow-xl hover:shadow-violet-500/20',
    'active:translate-y-0 active:scale-[0.98]'
  ),

  // DESTRUCTIVE - Red Gradient
  destructive: cn(
    'bg-gradient-to-r from-red-600 to-rose-600 text-white',
    'border border-zinc-700/50',
    'shadow-lg shadow-red-500/10',
    'hover:from-red-500 hover:to-rose-500',
    'hover:-translate-y-[1px] hover:shadow-xl hover:shadow-red-500/20',
    'active:translate-y-0 active:scale-[0.98]'
  ),

  // SUCCESS - Emerald Gradient
  success: cn(
    'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
    'border border-zinc-700/50',
    'shadow-lg shadow-emerald-500/10',
    'hover:from-emerald-500 hover:to-teal-500',
    'hover:-translate-y-[1px] hover:shadow-xl hover:shadow-emerald-500/20',
    'active:translate-y-0 active:scale-[0.98]'
  ),

  // WARNING - Amber Gradient
  warning: cn(
    'bg-gradient-to-r from-amber-600 to-orange-500 text-white',
    'border border-zinc-700/50',
    'shadow-lg shadow-amber-500/10',
    'hover:from-amber-500 hover:to-orange-400',
    'hover:-translate-y-[1px] hover:shadow-xl hover:shadow-amber-500/20',
    'active:translate-y-0 active:scale-[0.98]'
  ),

  // OUTLINE - Zinc-900 canvas background with border
  outline: cn(
    'bg-zinc-900 text-zinc-100',
    'border border-zinc-800',
    'shadow-sm',
    'hover:bg-zinc-800 hover:text-white',
    'hover:-translate-y-[1px]',
    'active:translate-y-0 active:scale-[0.98]'
  ),

  // SECONDARY - Zinc-800 Grey
  secondary: cn(
    'bg-zinc-800 text-zinc-100',
    'border border-zinc-700/50',
    'shadow-sm',
    'hover:bg-zinc-700 hover:text-white',
    'hover:-translate-y-[1px]',
    'active:translate-y-0 active:scale-[0.98]'
  ),

  // GHOST - No background, minimal styling
  ghost: cn(
    'bg-transparent text-zinc-400 hover:text-white',
    'border-none shadow-none',
    'hover:bg-zinc-800',
    'active:bg-zinc-800'
  ),

  // LINK - Text only with underline
  link: cn(
    'bg-transparent text-violet-400 hover:text-violet-300',
    'border-none shadow-none',
    'underline-offset-4 hover:underline',
    'p-0 h-auto'
  ),
};

// Size styles. Icon variant is 44×44px to meet WCAG 2.2 AA target size
// (success criterion 2.5.8). Call sites that override the visible size
// with smaller h-X w-X classes get the touch-area expansion via the
// iconHitArea overlay above.
const sizes = {
  default: 'h-10 px-6 py-2',
  sm: 'h-8 px-4 py-1 text-xs',
  lg: 'h-12 px-8 py-3 text-base',
  icon: cn('h-11 w-11 p-0', iconHitArea),
};

const baseStyles = cn(
  // Layout & Typography
  'relative inline-flex items-center justify-center gap-2',
  'whitespace-nowrap text-sm font-medium font-mono uppercase tracking-wide',
  // Transitions — only the properties that actually change on hover/active.
  'transition-all duration-200 ease-out',
  // Focus state - sharp violet ring
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
  // Disabled state
  'disabled:pointer-events-none disabled:opacity-50',
  // SVG icon sizing
  "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  // CareerOS: rounded-xl corners
  'rounded-xl'
);

export function getButtonClass(
  variant: ButtonProps['variant'] = 'default',
  size: ButtonProps['size'] = 'default',
  className?: string
): string {
  return cn(baseStyles, variants[variant], sizes[size], className);
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        suppressHydrationWarning
        className={getButtonClass(variant, size, className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
