'use client';

import { useState, useEffect } from 'react';

/**
 * A client-side hook to reliably determine if the application is running
 * in a development or preview environment provided by Firebase Studio.
 *
 * It checks for the `NEXT_PUBLIC_DEV_MODE` environment variable, which is
 * automatically set to 'true' by the IDE's development server.
 *
 * @returns {boolean} `true` if in a dev/preview environment, otherwise `false`.
 */
export function useIsDevMode(): boolean {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // This check must run on the client-side after hydration to access process.env.
    setIsDevMode(process.env.NEXT_PUBLIC_DEV_MODE === 'true');
  }, []);

  return isDevMode;
}
