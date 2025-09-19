'use client';

import { useState, useEffect } from 'react';

const DEV_MODE_SESSION_KEY = 'isFirebaseStudioDev';

/**
 * A client-side hook to reliably determine if the application is running in the developer's
 * specific Firebase Studio IDE session.
 *
 * It works by checking for a sessionStorage key ('isFirebaseStudioDev') that is set
 * by the root layout only when the app is rendered inside the IDE's iframe.
 * This method is secure because sessionStorage is not shared across tabs or users,
 * ensuring that public preview links do not expose developer tools.
 *
 * @returns {boolean} `true` if in the developer's IDE session, otherwise `false`.
 */
export function useIsDevMode(): boolean {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // This check only runs on the client-side after hydration.
    const isDevSession = sessionStorage.getItem(DEV_MODE_SESSION_KEY) === 'true';
    setIsDevMode(isDevSession);
  }, []);

  return isDevMode;
}
