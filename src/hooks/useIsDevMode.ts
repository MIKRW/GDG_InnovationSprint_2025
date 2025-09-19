'use client';

import { useState, useEffect } from 'react';

/**
 * A client-side hook to reliably determine if the application is running in
 * the development environment provided by the IDE.
 *
 * It works by checking the `NEXT_PUBLIC_DEV_MODE` environment variable, which
 * is set to 'true' by the local development server in the IDE but is not
 * present in the production build.
 *
 * @returns {boolean} `true` if in the development environment, otherwise `false`.
 */
export function useIsDevMode(): boolean {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // This check runs on the client-side after hydration.
    setIsDevMode(process.env.NEXT_PUBLIC_DEV_MODE === 'true');
  }, []);

  return isDevMode;
}
