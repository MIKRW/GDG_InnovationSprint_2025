
'use client';

import { ThemeManager } from '@/components/layout/ThemeManager';
import { Toaster } from '@/components/ui/toaster';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

const FIRST_INTERACTION_KEY = 'user-has-interacted';

/**
 * This component wraps all the client-side providers that are needed
 * in the root layout, such as the Toaster and the ThemeManager.
 */
export function ClientProviders({ children }: { children: ReactNode }) {

  useEffect(() => {
    const handleFirstInteraction = () => {
      sessionStorage.setItem(FIRST_INTERACTION_KEY, 'true');
      // The listener has done its job, so we can remove it.
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    // If the flag is already set, we don't need to do anything.
    if (!sessionStorage.getItem(FIRST_INTERACTION_KEY)) {
        window.addEventListener('click', handleFirstInteraction, { once: true });
        window.addEventListener('keydown', handleFirstInteraction, { once: true });
    }

    return () => {
        // Cleanup in case the component unmounts before interaction.
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  return (
    <>
      <ThemeManager />
      {children}
      <Toaster />
    </>
  );
}
