
'use client';

import { useEffect, type ReactNode } from 'react';

// This component's responsibility is now primarily to ensure that
// on the client-side, the correct class is applied on mount, and to
// provide a context for theme changes if needed in the future.
// The initial load is handled by the ThemeLoader in RootLayout.
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.classList.remove('light', 'dark', 'custom');
      document.documentElement.classList.add(savedTheme);
    } else {
      // Fallback for first-ever visit
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      document.documentElement.classList.add(initialTheme);
      localStorage.setItem('theme', initialTheme);
    }
  }, []);

  return <>{children}</>;
}
