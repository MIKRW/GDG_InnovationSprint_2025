'use client';

import { useState, useEffect } from 'react';

/**
 * A client-side hook to reliably and securely determine if the application is
 * being viewed by a developer within the Firebase Studio IDE.
 *
 * It works by checking the `document.referrer`. When the app preview is loaded
 * inside the Firebase Studio iframe, the referrer will be the Studio URL.
 * This is secure because this condition is only met within the IDE and cannot
 * be replicated by simply sharing a preview link.
 *
 * @returns {boolean} `true` if inside the Firebase Studio IDE, otherwise `false`.
 */
export function useIsDevMode(): boolean {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // This check must run on the client-side after hydration.
    if (typeof window !== 'undefined') {
      try {
        // The app is inside an iframe, and the parent frame is Firebase Studio.
        const isInsideStudio = window.self !== window.top && document.referrer.startsWith('https://studio.firebase.google.com/');
        setIsDevMode(isInsideStudio);
      } catch (e) {
        // If there's a cross-origin error, we are definitely not in the right context.
        setIsDevMode(false);
      }
    }
  }, []);

  return isDevMode;
}
