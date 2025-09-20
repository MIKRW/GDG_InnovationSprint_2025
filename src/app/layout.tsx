import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata, Viewport } from 'next';
import { ThemeManager } from '@/components/layout/ThemeManager';

// This is the root layout for the entire application.
// It sets up the basic HTML structure, fonts, and global styles.

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Metadata and viewport must be exported from a Server Component.
export const metadata: Metadata = {
  title: 'Lyre',
  description: 'An AI-powered bird song identifier',
  appleWebAppCapable: 'yes',
  appleMobileWebAppStatusBarStyle: 'default',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeManager />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
