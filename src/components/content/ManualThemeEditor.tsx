
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  title,
  color,
  onColorChange,
}: {
  title: string;
  color: ThemeColor;
  onColorChange: (newColor: ThemeColor) => void;
}) => {
  const handleSliderChange = (
    property: keyof ThemeColor,
    value: number[]
  ) => {
    onColorChange({ ...color, [property]: value[0] });
  };

  const colorStyle = {
    backgroundColor: `hsl(${color.h}, ${color.s}%, ${color.l}%)`,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <div
          className="w-10 h-10 rounded-full border"
          style={colorStyle}
        ></div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor={`${title}-h`}>Hue</Label>
            <span>{color.h}</span>
          </div>
          <Slider
            id={`${title}-h`}
            max={360}
            step={1}
            value={[color.h]}
            onValueChange={(value) => handleSliderChange('h', value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor={`${title}-s`}>Saturation</Label>
            <span>{color.s}%</span>
          </div>
          <Slider
            id={`${title}-s`}
            max={100}
            step={1}
            value={[color.s]}
            onValueChange={(value) => handleSliderChange('s', value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor={`${title}-l`}>Lightness</Label>
            <span>{color.l}%</span>
          </div>
          <Slider
            id={`${title}-l`}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ColorEditor
                title="Background"
                color={theme.colors.background}
                onColorChange={(newColor) => onColorChange('background', newColor)}
            />
            <ColorEditor
                title="Foreground"
                color={theme.colors.foreground}
                onColorChange={(newColor) => onColorChange('foreground', newColor)}
            />
            <ColorEditor
                title="Primary"
                color={theme.colors.primary}
                onColorChange={(newColor) => onColorChange('primary', newColor)}
            />
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 items-stretch gap-4">
            <div className="md:col-start-2 h-40">
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
                className="w-full h-40 text-lg md:col-start-3"
            >
                <Save className="mr-2 h-4 w-4" />
                Save Manual Theme to Slot
            </Button>
        </div>
    </div>
  );
}

    