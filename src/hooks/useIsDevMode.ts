'use client';

import { useState, useEffect } from 'react';

/**
 * A client-side hook to reliably determine if the application is running
 * inside the Firebase Studio development environment.
 *
 * It checks if the app is running in an iframe and if the parent
 * window's origin is 'https://studio.firebase.google.com'.
 * This is a secure way to distinguish the IDE preview from any public deployment.
 *
 * @returns {boolean} `true` if in the Firebase Studio environment, otherwise `false`.
 */
export function useIsDevMode(): boolean {
  const [isDevMode, setIsDevMode] = useState(process.env.NEXT_PUBLIC_DEV_MODE === 'true');

  useEffect(() => {
    // This check must run on the client-side after hydration to access window properties.
    try {
      // Check if the window is inside an iframe and if the parent's origin is Firebase Studio.
      const inIframe = window.self !== window.top;
      const isStudio = inIframe && window.parent.location.origin === 'https://studio.firebase.google.com';
      setIsDevMode(isStudio);
    } catch (e) {
      // Accessing window.parent.location can throw a cross-origin error if not handled.
      // If an error occurs, we are not in a friendly iframe, so it's not dev mode.
      setIsDevMode(false);
    }
  }, []);

  return isDevMode;
}
