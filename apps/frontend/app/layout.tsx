import type { Metadata } from 'next';
import { Geist, Space_Grotesk, Inter } from 'next/font/google';
import './(default)/css/globals.css';
import { AuthProvider } from '@/lib/context/auth-context';
import { StatusCacheProvider } from '@/lib/context/status-cache';
import { LanguageProvider } from '@/lib/context/language-context';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CareerOS',
  description: 'AI-Powered Career Optimization OS',
  applicationName: 'CareerOS',
  keywords: ['career', 'resume', 'tailoring', 'copilot', 'job', 'tracker'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className="h-full" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${spaceGrotesk.variable} ${inter.variable} antialiased bg-background text-foreground min-h-full`}
      >
        {/* ── Animated Aurora Background (fixed, behind everything) ── */}
        <div className="aurora-bg" aria-hidden="true" />
        <div className="aurora-orb-3" aria-hidden="true" />
        <div className="aurora-grid" aria-hidden="true" />

        <StatusCacheProvider>
          <LanguageProvider>
            <AuthProvider>{children}</AuthProvider>
          </LanguageProvider>
        </StatusCacheProvider>
      </body>
    </html>
  );
}
