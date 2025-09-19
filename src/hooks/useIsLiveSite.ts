'use client';

import { useState, useEffect } from 'react';

// The specific hostname of the live, deployed application.
const LIVE_HOSTNAME = 'lyre-app-backend--studio-2836459659-ecbdf.us-east4.hosted.app';

/**
 * A client-side hook to reliably determine if the application is running
 * on the live production URL. It defaults to 'true' to ensure a secure-first
 * approach, treating any unknown environment as if it were live.
 *
 * @returns {boolean} `true` if the current hostname matches the live site, otherwise `false`.
 */
export function useIsLiveSite(): boolean {
  // Default to true (secure by default) and update after client-side check.
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // This check must run on the client-side after hydration to access window.location.
    const currentHostname = window.location.hostname;
    setIsLive(currentHostname === LIVE_HOSTNAME);
  }, []); // The empty dependency array ensures this runs only once on the client.

  return isLive;
}
