
'use client';

import { useLayoutEffect } from 'react';

// This script runs immediately to prevent a flash of unstyled content (FOUC).
const themeScript = `
  (function() {
    // Set theme from localStorage
    try {
      const savedThemeClass = localStorage.getItem('theme') || 'light';
      document.documentElement.className = savedThemeClass;

      if (savedThemeClass === 'custom') {
        const activeThemeJson = localStorage.getItem('active-theme-json');
        if (activeThemeJson) {
          const activeTheme = JSON.parse(activeThemeJson);
          if (activeTheme && activeTheme.colors) {
            const { colors } = activeTheme;
            const ringColor = colors.ring || colors.primary;
            const root = document.documentElement;

            root.style.setProperty('--custom-background-h', '' + colors.background.h);
            root.style.setProperty('--custom-background-s', colors.background.s + '%');
            root.style.setProperty('--custom-background-l', colors.background.l + '%');
            root.style.setProperty('--custom-foreground-h', '' + colors.foreground.h);
            root.style.setProperty('--custom-foreground-s', colors.foreground.s + '%');
            root.style.setProperty('--custom-foreground-l', colors.foreground.l + '%');
            root.style.setProperty('--custom-primary-h', '' + colors.primary.h);
            root.style.setProperty('--custom-primary-s', colors.primary.s + '%');
            root.style.setProperty('--custom-primary-l', colors.primary.l + '%');
            root.style.setProperty('--custom-ring-h', '' + (ringColor.h || colors.primary.h));
            root.style.setProperty('--custom-ring-s', (ringColor.s || colors.primary.s) + '%');
            root.style.setProperty('--custom-ring-l', (ringColor.l || colors.primary.l) + '%');
          }
        }
      }
    } catch (e) {
      console.error('Failed to apply theme from localStorage', e);
    }
  })();
`;

/**
 * This component is responsible for injecting the theme script into the <head>.
 * It's a client component because it needs to run a script, but it allows the
 * root layout to remain a server component.
 */
export function ThemeManager() {
    useLayoutEffect(() => {
        const script = document.createElement('script');
        script.innerHTML = themeScript;
        document.head.appendChild(script);
        
        return () => {
            document.head.removeChild(script);
        }
    }, []);

    return null;
}
