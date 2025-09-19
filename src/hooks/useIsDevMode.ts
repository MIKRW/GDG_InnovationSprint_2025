'use client';

import { useState, useEffect } from 'react';

/**
 * A client-side hook to reliably determine if the application is running in a local development environment.
 * It checks the `NEXT_PUBLIC_DEV_MODE` environment variable, which is set by the Next.js development server.
 * This is the most reliable way to detect the dev environment within the Firebase Studio IDE.
 * @returns {boolean} `true` if in dev mode, otherwise `false`.
 */
export function useIsDevMode(): boolean {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // This check only runs on the client-side after hydration.
    // It's safe to access process.env for a NEXT_PUBLIC_ variable.
    setIsDevMode(process.env.NEXT_PUBLIC_DEV_MODE === 'true');
  }, []);

  return isDevMode;
}
