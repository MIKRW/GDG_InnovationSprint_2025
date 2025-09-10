'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Contrast } from 'lucide-react';

const themes = ['light', 'dark', 'custom'];

export function ContrastButton() {
  // We only need to know the *next* theme to set in localStorage.
  // The actual application of the theme is handled by ThemeProvider.
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    // On mount, read the theme from localStorage to know our starting point.
    const savedTheme = localStorage.getItem('theme') || 'light';
    setCurrentTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    // Set the new theme in localStorage
    localStorage.setItem('theme', nextTheme);
    
    // Manually update the class on the root element to trigger an immediate visual change.
    // The ThemeProvider will handle this on subsequent page loads.
    document.documentElement.classList.remove(...themes);
    document.documentElement.classList.add(nextTheme);

    // Update our internal state
    setCurrentTheme(nextTheme);
  };

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle Contrast" onClick={toggleTheme}>
      <Contrast className="h-5 w-5" />
    </Button>
  );
}
