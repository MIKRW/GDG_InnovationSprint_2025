
'use client';

import { ThemeManager } from '@/components/layout/ThemeManager';
import { Toaster } from '@/components/ui/toaster';
import type { ReactNode } from 'react';

/**
 * This component wraps all the client-side providers that are needed
 * in the root layout, such as the Toaster and the ThemeManager.
 * This keeps the root layout itself as a clean Server Component.
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <ThemeManager />
      {children}
      <Toaster />
    </>
  );
}
