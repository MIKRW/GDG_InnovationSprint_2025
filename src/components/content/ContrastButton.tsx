
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Contrast } from 'lucide-react';

const themes = ['light', 'dark', 'custom'];

export function ContrastButton() {
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setCurrentTheme(savedTheme);

    const handleStorageChange = () => {
      const newTheme = localStorage.getItem('theme') || 'light';
      setCurrentTheme(newTheme);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleTheme = () => {
    // Exit preview mode if active
    const isPreviewing = sessionStorage.getItem('theme-preview-active') === 'true';
    if (isPreviewing) {
        sessionStorage.removeItem('theme-preview-active');
        const lastActiveTheme = localStorage.getItem('active-theme-json');
        if(lastActiveTheme) {
            try {
                const root = document.documentElement;
                const theme = JSON.parse(lastActiveTheme);
                if (theme) {
                    root.style.setProperty('--custom-background-h', `${theme.colors.background.h}`);
                    root.style.setProperty('--custom-background-s', `${theme.colors.background.s}%`);
                    root.style.setProperty('--custom-background-l', `${theme.colors.background.l}%`);
                    root.style.setProperty('--custom-foreground-h', `${theme.colors.foreground.h}`);
                    root.style.setProperty('--custom-foreground-s', `${theme.colors.foreground.s}%`);
                    root.style.setProperty('--custom-foreground-l', `${theme.colors.foreground.l}%`);
                    root.style.setProperty('--custom-primary-h', `${theme.colors.primary.h}`);
                    root.style.setProperty('--custom-primary-s', `${theme.colors.primary.s}%`);
                    root.style.setProperty('--custom-primary-l', `${theme.colors.primary.l}%`);
                    const ringColor = theme.colors.ring || theme.colors.primary;
                    root.style.setProperty('--custom-ring-h', `${ringColor.h}`);
                    root.style.setProperty('--custom-ring-s', `${ringColor.s}%`);
                    root.style.setProperty('--custom-ring-l', `${ringColor.l}%`);
                }
            } catch (e) {
                console.error("Failed to parse active theme from localStorage", e);
            }
        }
        window.dispatchEvent(new Event('preview-exit'));
        return;
    }


    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    localStorage.setItem('theme', nextTheme);
    
    document.documentElement.classList.remove(...themes);
    document.documentElement.classList.add(nextTheme);

    setCurrentTheme(nextTheme);
  };

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle Contrast" onClick={toggleTheme} className="h-20 w-20">
      <Contrast className="h-10 w-10" strokeWidth={2.5} />
    </Button>
  );
}
