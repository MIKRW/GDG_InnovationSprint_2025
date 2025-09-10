
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ThemeColor } from '@/lib/types';
import { Check } from 'lucide-react';

const swatches: ThemeColor[] = [
  // Grayscale
  { h: 0, s: 0, l: 10 },    // Almost Black
  { h: 0, s: 0, l: 40 },   // Dark Gray
  { h: 0, s: 0, l: 95 },   // Almost White

  // Sepia Tones
  { h: 30, s: 30, l: 20 }, // Dark Brown
  { h: 40, s: 50, l: 30 }, // Brown
  { h: 45, s: 70, l: 95 }, // Light Cream

  // Blues
  { h: 210, s: 30, l: 20 },// Dark Blue
  { h: 220, s: 70, l: 50 },// Bright Blue
  { h: 200, s: 90, l: 95 },// Light Blue

  // Greens
  { h: 140, s: 30, l: 20 },// Dark Green
  { h: 150, s: 70, l: 40 },// Green
  { h: 160, s: 90, l: 95 },// Light Green

  // Reds / Pinks
  { h: 0, s: 40, l: 30 },  // Dark Red
  { h: 340, s: 80, l: 60 },// Pink
  { h: 350, s: 100, l: 95 },// Light Pink
];

export function ColorSwatchPicker({
  title,
  selectedColor,
  onColorChange,
}: {
  title: string;
  selectedColor: ThemeColor;
  onColorChange: (color: ThemeColor) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {swatches.map((swatch, i) => {
            const isActive =
              swatch.h === selectedColor.h &&
              swatch.s === selectedColor.s &&
              swatch.l === selectedColor.l;

            return (
              <button
                key={i}
                type="button"
                className={cn(
                  'h-12 w-12 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center',
                  isActive ? 'border-primary' : 'border-muted'
                )}
                style={{
                  backgroundColor: `hsl(${swatch.h}, ${swatch.s}%, ${swatch.l}%)`,
                }}
                aria-label={`Color swatch H${swatch.h} S${swatch.s} L${swatch.l}`}
                onClick={() => onColorChange(swatch)}
              >
                {isActive && (
                  <Check
                    className="h-6 w-6"
                    style={{
                      color: `hsl(${selectedColor.h}, ${selectedColor.s}%, ${selectedColor.l > 50 ? 10 : 90}%)`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
