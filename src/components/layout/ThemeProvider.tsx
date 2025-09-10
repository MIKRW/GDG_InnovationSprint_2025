'use client';

import { useEffect, type ReactNode } from 'react';

const themes = ['light', 'dark', 'custom'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    const root = document.documentElement;
    root.classList.remove(...themes);
    root.classList.add(initialTheme);
  }, []);

  return <>{children}</>;
}
