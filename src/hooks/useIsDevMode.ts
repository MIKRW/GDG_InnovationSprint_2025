
'use client';

import { useState, useEffect } from 'react';

/**
 * A client-side hook to reliably determine if the application is running in a local development environment.
 * It returns `true` if the hostname is 'localhost' or 'studio.firebase.google.com', and `false` otherwise.
 * This avoids issues with build-time environment variables.
 * @returns {boolean} `true` if in dev mode, otherwise `false`.
 */
export function useIsDevMode(): boolean {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // This check only runs on the client-side after hydration.
    // It's safe to access `window` here.
    if (typeof window !== 'undefined') {
      const isDevHostname =
        window.location.hostname === 'localhost' ||
        window.location.hostname === 'studio.firebase.google.com';
      setIsDevMode(isDevHostname);
    }
  }, []);

  return isDevMode;
}
