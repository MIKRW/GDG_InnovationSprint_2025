'use client';

import { useState, useEffect } from 'react';

/**
 * A client-side hook to reliably determine if the application is running in a local development environment.
 * This is the most reliable way to detect the dev environment within the Firebase Studio IDE.
 * @returns {boolean} `true` if in dev mode, otherwise `false`.
 */
export function useIsDevMode(): boolean {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // This check only runs on the client-side after hydration.
    // It's safe to access process.env for a NEXT_PUBLIC_ variable and window properties.
    const isLocal = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    const isCloudIde =
      window.location.hostname.includes('studio.firebase.google.com') ||
      window.location.hostname.endsWith('.cloudworkstations.dev');
      
    setIsDevMode(isLocal || isCloudIde);
  }, []);

  return isDevMode;
}
