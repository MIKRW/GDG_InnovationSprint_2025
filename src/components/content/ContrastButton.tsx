'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Contrast } from 'lucide-react';

const themes = ['light', 'dark', 'custom'];

export function ContrastButton() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...themes.filter(t => t !== 'light'));

    if (theme !== 'light') {
      root.classList.add(theme);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle Contrast" onClick={toggleTheme}>
      <Contrast className="h-5 w-5" />
    </Button>
  );
}
