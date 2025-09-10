
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { debounce } from 'lodash';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import type { ThemeColor } from '@/lib/types';

const DEFAULTS = {
  background: { h: 39, s: 100, l: 97 },
  foreground: { h: 39, s: 50, l: 10 },
  primary: { h: 39, s: 50, l: 20 },
};

function ColorSlider({
  label,
  value,
  max,
  onValueChange,
}: {
  label: string;
  value: number;
  max: number;
  onValueChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground">{value}</span>
      </div>
      <Slider
        value={[value]}
        max={max}
        step={1}
        onValueChange={(v) => onValueChange(v[0])}
      />
    </div>
  );
}

function ThemeEditor({
  title,
  color,
  setColor,
}: {
  title: string;
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <ColorSlider
          label="Hue"
          value={color.h}
          max={360}
          onValueChange={(h) => setColor({ ...color, h })}
        />
        <ColorSlider
          label="Saturation"
          value={color.s}
          max={100}
          onValueChange={(s) => setColor({ ...color, s })}
        />
        <ColorSlider
          label="Lightness"
          value={color.l}
          max={100}
          onValueChange={(l) => setColor({ ...color, l })}
        />
      </CardContent>
    </Card>
  );
}

export function ThemeSettings() {
  const [background, setBackground] = useState<ThemeColor>(DEFAULTS.background);
  const [foreground, setForeground] = useState<ThemeColor>(DEFAULTS.foreground);
  const [primary, setPrimary] = useState<ThemeColor>(DEFAULTS.primary);

  useEffect(() => {
    const savedBg = localStorage.getItem('custom-theme-background');
    const savedFg = localStorage.getItem('custom-theme-foreground');
    const savedPri = localStorage.getItem('custom-theme-primary');

    if (savedBg) setBackground(JSON.parse(savedBg));
    if (savedFg) setForeground(JSON.parse(savedFg));
    if (savedPri) setPrimary(JSON.parse(savedPri));
  }, []);
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateCSSVariables = useCallback(
    debounce((colors: { background: ThemeColor; foreground: ThemeColor; primary: ThemeColor }) => {
      const root = document.documentElement;
      root.style.setProperty('--custom-background-h', `${colors.background.h}`);
      root.style.setProperty('--custom-background-s', `${colors.background.s}%`);
      root.style.setProperty('--custom-background-l', `${colors.background.l}%`);

      root.style.setProperty('--custom-foreground-h', `${colors.foreground.h}`);
      root.style.setProperty('--custom-foreground-s', `${colors.foreground.s}%`);
      root.style.setProperty('--custom-foreground-l', `${colors.foreground.l}%`);

      root.style.setProperty('--custom-primary-h', `${colors.primary.h}`);
      root.style.setProperty('--custom-primary-s', `${colors.primary.s}%`);
      root.style.setProperty('--custom-primary-l', `${colors.primary.l}%`);
    }, 150),
    []
  );
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveToLocalStorage = useCallback(
    debounce((colors: { background: ThemeColor; foreground: ThemeColor; primary: ThemeColor }) => {
      localStorage.setItem('custom-theme-background', JSON.stringify(colors.background));
      localStorage.setItem('custom-theme-foreground', JSON.stringify(colors.foreground));
      localStorage.setItem('custom-theme-primary', JSON.stringify(colors.primary));
    }, 500),
    []
  );

  useEffect(() => {
    const colors = { background, foreground, primary };
    updateCSSVariables(colors);
    saveToLocalStorage(colors);
  }, [background, foreground, primary, updateCSSVariables, saveToLocalStorage]);

  return (
    <div className="space-y-6">
      <ThemeEditor title="Background Color" color={background} setColor={setBackground} />
      <ColorSwatchPicker title="Foreground Color" selectedColor={foreground} onColorChange={setForeground} />
      <ColorSwatchPicker title="Primary Color" selectedColor={primary} onColorChange={setPrimary} />
    </div>
  );
}
