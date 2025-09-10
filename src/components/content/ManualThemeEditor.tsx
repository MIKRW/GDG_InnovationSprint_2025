
'use client';

import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="h-full">
      <CardContent className="space-y-6 flex flex-col justify-center h-full p-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Hue</Label>
            <span>{color.h}</span>
          </div>
          <Slider
            max={360}
            step={1}
            value={[color.h]}
            onValueChange={(value) => handleSliderChange('h', value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Saturation</Label>
            <span>{color.s}%</span>
          </div>
          <Slider
            max={100}
            step={1}
            value={[color.s]}
            onValueChange={(value) => handleSliderChange('s', value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Lightness</Label>
            <span>{color.l}%</span>
          </div>
          <Slider
            max={100}
            step={1}
            value={[color.l]}
            onValueChange={(value) => handleSliderChange('l', value)}
          />
        </div>
      </CardContent>
    </Card>
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
            <div className="h-40">
                <ColorEditor
                    color={theme.colors.background}
                    onColorChange={(newColor) => onColorChange('background', newColor)}
                />
            </div>
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
                Save Manual Theme to Slot
            </Button>
        </div>
    </div>
  );
}
