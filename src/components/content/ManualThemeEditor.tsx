
'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { Theme, ThemeColor } from '@/lib/types';
import { Button } from '../ui/button';
import { Save } from 'lucide-react';
import { ThemeHistoryItem } from './ThemeHistoryItem';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '../ui/card';

interface ManualThemeEditorProps {
  theme: Theme;
  onColorChange: (
    colorName: keyof Theme['colors'],
    newColor: ThemeColor
  ) => void;
  onSave: () => void;
  onPreview: () => void;
  isPreviewing: boolean;
}

type EditableColor = 'background' | 'foreground' | 'primary';

const ColorEditor = ({
  color,
  onColorChange,
}: {
  color: ThemeColor;
  onColorChange: (newColor: ThemeColor) => void;
}) => {
  const handleSliderChange = (
    property: keyof ThemeColor,
    value: number[]
  ) => {
    onColorChange({ ...color, [property]: value[0] });
  };

  return (
    <div
      className={cn(
        'relative flex h-40 w-full flex-col justify-center gap-4 rounded-lg bg-primary p-4 text-primary-foreground'
      )}
    >
      <div className="flex items-center gap-4">
        <Label className="w-24 text-2xl">Hue</Label>
        <Slider
          max={360}
          step={1}
          value={[color.h]}
          onValueChange={(value) => handleSliderChange('h', value)}
          className="[&>span]:bg-primary-foreground/20 [&>span>div]:bg-primary-foreground [&>span>span]:border-primary-foreground [&>span>span]:bg-primary"
        />
      </div>
      <div className="flex items-center gap-4">
        <Label className="w-24 text-2xl">Sat</Label>
        <Slider
          max={100}
          step={1}
          value={[color.s]}
          onValueChange={(value) => handleSliderChange('s', value)}
          className="[&>span]:bg-primary-foreground/20 [&>span>div]:bg-primary-foreground [&>span>span]:border-primary-foreground [&>span>span]:bg-primary"
        />
      </div>
      <div className="flex items-center gap-4">
        <Label className="w-24 text-2xl">Light</Label>
        <Slider
          max={100}
          step={1}
          value={[color.l]}
          onValueChange={(value) => handleSliderChange('l', value)}
          className="[&>span]:bg-primary-foreground/20 [&>span>div]:bg-primary-foreground [&>span>span]:border-primary-foreground [&>span>span]:bg-primary"
        />
      </div>
    </div>
  );
};

export function ManualThemeEditor({
  theme,
  onColorChange,
  onSave,
  onPreview,
  isPreviewing,
}: ManualThemeEditorProps) {
  const [selectedColor, setSelectedColor] = useState<EditableColor>('background');

  const handleColorSelect = (e: React.MouseEvent, colorName: EditableColor) => {
    e.stopPropagation();
    setSelectedColor(colorName);
    onPreview();
  }

  const { colors } = theme;
  const ringColor = colors.ring || colors.primary;

  const styles = {
    background: `hsl(${colors.background.h}, ${colors.background.s}%, ${colors.background.l}%)`,
    foreground: `hsl(${colors.foreground.h}, ${colors.foreground.s}%, ${colors.foreground.l}%)`,
    primary: `hsl(${colors.primary.h}, ${colors.primary.s}%, ${colors.primary.l}%)`,
    ring: `hsl(${ringColor.h}, ${ringColor.s}%, ${ringColor.l}%)`,
  };

  const selectionStyle = isPreviewing
    ? {
        boxShadow: `0 0 0 4px ${styles.ring}`,
      }
    : {};

  return (
    <div>
      <h2 className="mb-12 text-center text-4xl font-bold">
        Manual Theme Editor
      </h2>
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
        <ColorEditor
          color={theme.colors[selectedColor]}
          onColorChange={(newColor) => onColorChange(selectedColor, newColor)}
        />
        <div className="h-40">
        <Card
          onClick={onPreview}
          className={cn('h-full cursor-pointer transition-all hover:shadow-lg', isPreviewing && 'ring-4 ring-ring')}
          style={selectionStyle}
        >
          <CardContent className="relative flex h-full flex-col space-y-4 rounded-lg bg-card/80 p-4">
            <div
              className="flex-grow overflow-hidden rounded-md flex mt-4"
              style={{ backgroundColor: styles.background, border: selectedColor === 'background' ? '2px solid black' : '2px solid transparent', padding: '2px' }}
              onClick={(e) => handleColorSelect(e, 'background')}
            >
              <div
                className={cn("w-1/3 h-full", selectedColor === 'foreground' && 'ring-2 ring-inset ring-black')}
                style={{ backgroundColor: styles.foreground,  border: selectedColor === 'foreground' ? '2px solid black' : '2px solid transparent' }}
                onClick={(e) => handleColorSelect(e, 'foreground')}
              ></div>
              <div
                className={cn("w-1/3 h-full", selectedColor === 'primary' && 'ring-2 ring-inset ring-black')}
                style={{ backgroundColor: styles.primary,  border: selectedColor === 'primary' ? '2px solid black' : '2px solid transparent' }}
                onClick={(e) => handleColorSelect(e, 'primary')}
              ></div>
            </div>
          </CardContent>
        </Card>
        </div>
        <Button type="button" onClick={onSave} className="h-40 w-full text-lg">
          <Save className="mr-2 h-4 w-4" />
          Save Manual Theme
        </Button>
      </div>
    </div>
  );
}
