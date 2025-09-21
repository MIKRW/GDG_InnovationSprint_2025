
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Contrast } from 'lucide-react';

const themes = ['light', 'dark', 'custom'];

export function ContrastButton() {
  const [currentTheme, setCurrentTheme] = useState('light');

  // Effect to set the initial theme from localStorage on mount.
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setCurrentTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    localStorage.setItem('theme', nextTheme);
    
    // Apply the new theme class to the document root.
    document.documentElement.classList.remove(...themes);
    document.documentElement.classList.add(nextTheme);

    // If switching to custom, ensure its styles are applied from the active theme.
    if (nextTheme === 'custom') {
        const activeThemeJson = localStorage.getItem('active-theme-json');
        if (activeThemeJson) {
            try {
                const activeTheme = JSON.parse(activeThemeJson);
                if (activeTheme && activeTheme.colors) {
                    const root = document.documentElement;
                    const { colors } = activeTheme;
                    const ringColor = colors.ring || colors.primary;

                    root.style.setProperty('--custom-background-h', `${colors.background.h}`);
                    root.style.setProperty('--custom-background-s', `${colors.background.s}%`);
                    root.style.setProperty('--custom-background-l', `${colors.background.l}%`);
                    root.style.setProperty('--custom-foreground-h', `${colors.foreground.h}`);
                    root.style.setProperty('--custom-foreground-s', `${colors.foreground.s}%`);
                    root.style.setProperty('--custom-foreground-l', `${colors.foreground.l}%`);
                    root.style.setProperty('--custom-primary-h', `${colors.primary.h}`);
                    root.style.setProperty('--custom-primary-s', `${colors.primary.s}%`);
                    root.style.setProperty('--custom-primary-l', `${colors.primary.l}%`);
                    root.style.setProperty('--custom-ring-h', `${ringColor.h}`);
                    root.style.setProperty('--custom-ring-s', `${ringColor.s}%`);
                    root.style.setProperty('--custom-ring-l', `${ringColor.l}%`);
                }
            } catch (e) {
                console.error("Failed to apply custom theme styles:", e);
            }
        }
    }

    setCurrentTheme(nextTheme);
  };

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle Contrast" onClick={toggleTheme} className="h-40 w-40">
      <Contrast className="h-32 w-32" strokeWidth={2.5} />
    </Button>
  );
}
