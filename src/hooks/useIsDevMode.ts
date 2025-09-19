'use client';

import { useState, useEffect } from 'react';

/**
 * A client-side hook to reliably determine if the application is running in a local development environment.
 * This is the most reliable way to detect the dev environment within the Firebase Studio IDE.
 * It relies on an environment variable set by the local dev server.
 * @returns {boolean} `true` if in dev mode, otherwise `false`.
 */
export function useIsDevMode(): boolean {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // This check only runs on the client-side after hydration.
    // It is the most secure way to distinguish the IDE's dev server from any other environment.
    const isLocalDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    setIsDevMode(isLocalDev);
  }, []);

  return isDevMode;
}
