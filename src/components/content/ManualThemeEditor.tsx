
'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { Theme, ThemeColor } from '@/lib/types';
import { Button } from '../ui/button';
import { Save } from 'lucide-react';
import { ThemeHistoryItem } from './ThemeHistoryItem';

interface ManualThemeEditorProps {
  theme: Theme;
  selectedSlot: number;
  onColorChange: (colorName: keyof Theme['colors'], newColor: ThemeColor) => void;
  onSave: () => void;
  onPreview: () => void;
  isPreviewing: boolean;
}

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
    <div className="bg-primary text-primary-foreground rounded-lg p-4 w-full h-40 flex flex-col justify-center space-y-4">
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
  selectedSlot,
  onPreview,
  isPreviewing,
}: ManualThemeEditorProps) {
  return (
    <div>
        <h2 className="text-4xl font-bold text-center mb-12">
            Manual Theme Editor
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 items-stretch gap-4">
            <ColorEditor
                color={theme.colors.background}
                onColorChange={(newColor) => onColorChange('background', newColor)}
            />
            <div className="h-40">
                <ThemeHistoryItem
                    theme={theme}
                    onClick={onPreview}
                    emptyText="Adjust sliders to see preview."
                    isEmpty={false}
                    isSelected={isPreviewing}
                />
            </div>
            <Button
                type="button"
                onClick={onSave}
                className="w-full h-40 text-lg"
            >
                <Save className="mr-2 h-4 w-4" />
                Save Manual Theme
            </Button>
        </div>
    </div>
  );
}
