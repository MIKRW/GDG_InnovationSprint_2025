'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateTheme } from '@/ai/flows/generate-theme-flow';
import type { Theme } from '@/lib/types';
import { Loader2, Save } from 'lucide-react';
import { ThemeHistoryItem } from './ThemeHistoryItem';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  background: z.string().min(2, { message: 'Please enter a word.' }),
  foreground: z.string().min(2, { message: 'Please enter a word.' }),
  primary: z.string().min(2, { message: 'Please enter a word.' }),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULTS: Theme = {
  id: 'default',
  words: { background: 'sand', foreground: 'stone', primary: 'ocean' },
  colors: {
    background: { h: 39, s: 100, l: 97 },
    foreground: { h: 39, s: 50, l: 10 },
    primary: { h: 39, s: 50, l: 20 },
  },
  isActive: true,
};

const EMPTY_THEME: Theme = {
  id: 'empty',
  words: { background: '', foreground: '', primary: '' },
  colors: {
    background: { h: 0, s: 0, l: 100 },
    foreground: { h: 0, s: 0, l: 0 },
    primary: { h: 0, s: 0, l: 50 },
  },
  isActive: false,
};

const MAX_SAVED_THEMES = 5;

export function ThemeGenerator() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<Theme>(EMPTY_THEME);
  const [savedThemes, setSavedThemes] = useState<Theme[]>([]);
  const [selectedSlot, setSelectedSlot] = useState(0);

  // Load saved themes from localStorage on initial mount
  useEffect(() => {
    const savedThemesJson = localStorage.getItem('custom-themes');
    let initialThemes: Theme[] = [];
    if (savedThemesJson) {
      initialThemes = JSON.parse(savedThemesJson);
    }
    
    // Ensure there are always MAX_SAVED_THEMES slots
    const filledThemes = Array.from({ length: MAX_SAVED_THEMES }).map((_, i) => {
        if (initialThemes[i]) return initialThemes[i];
        const newTheme = { ...DEFAULTS, id: uuidv4(), isActive: i === 0 };
        if (i > 0) newTheme.words = { background: 'new', foreground: 'theme', primary: 'slot' };
        return newTheme;
    });

    setSavedThemes(filledThemes);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { background: '', foreground: '', primary: '' },
  });

  const updateCSSVariables = useCallback((colors: Theme['colors']) => {
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
  }, []);
  
  // This effect only updates the live preview (CSS variables) from the preview theme
  useEffect(() => {
    if (previewTheme.id !== 'empty') {
      updateCSSVariables(previewTheme.colors);
    }
  }, [previewTheme, updateCSSVariables]);
  
  // Effect to apply the active theme from savedThemes on load
  useEffect(() => {
    const activeTheme = savedThemes.find(t => t.isActive);
    if (activeTheme) {
      updateCSSVariables(activeTheme.colors);
    }
  }, [savedThemes, updateCSSVariables]);


  const saveToSlot = () => {
    if (previewTheme.id === 'empty') {
      toast({
        variant: 'destructive',
        title: 'No Preview',
        description: 'Please generate a theme before trying to save.',
      });
      return;
    }

    const newSavedThemes = savedThemes.map((theme, index) => {
      if (index === selectedSlot) {
        // The theme being saved into slot 0 becomes the active theme
        const newTheme = { ...previewTheme, id: uuidv4(), isActive: index === 0 };
        return newTheme;
      }
      // If we're saving to slot 0, all other themes must be inactive
      if (selectedSlot === 0) {
        return { ...theme, isActive: false };
      }
      return theme;
    });

    setSavedThemes(newSavedThemes);
    localStorage.setItem('custom-themes', JSON.stringify(newSavedThemes));
    
    // If we saved to the active slot, also update the global theme setting
    if (selectedSlot === 0) {
        localStorage.setItem('theme', 'custom');
    }

    toast({
      title: 'Theme Saved!',
      description: `Saved to slot ${selectedSlot + 1}.`,
    });
    setPreviewTheme(EMPTY_THEME);
    form.reset({ background: '', foreground: '', primary: '' });
  };


  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const newColors = await generateTheme({ ...values });
      
      const newTheme: Theme = {
        id: uuidv4(),
        words: values,
        colors: newColors,
        isActive: false,
      };

      setPreviewTheme(newTheme);
      
      toast({
        title: 'Theme Generated!',
        description: 'Click a save slot, then "Save Theme".',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate the theme. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSlotClick = (index: number) => {
    setSelectedSlot(index);
    const themeToPreview = savedThemes[index];
    setPreviewTheme(themeToPreview);
    form.reset(themeToPreview.words);
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <FormField
              control={form.control}
              name="background"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="background" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="foreground"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="foreground" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primary"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="primary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="h-10">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Theme'
              )}
            </Button>
          </div>
        </form>
      </Form>
      
      <div className="mt-8 flex justify-center">
        <Button onClick={saveToSlot} size="lg" disabled={previewTheme.id === 'empty'}>
          <Save className="mr-2 h-4 w-4" />
          Save Theme to Selected Slot
        </Button>
      </div>

      <div className="mt-12">
        <Separator className="my-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className='lg:col-span-1'>
                <h2 className="text-2xl font-bold text-center mb-4">Preview</h2>
                <ThemeHistoryItem
                    theme={previewTheme.id === 'empty' ? EMPTY_THEME : previewTheme}
                    onClick={() => {}}
                    isEmpty={previewTheme.id === 'empty'}
                />
            </div>
            <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-center mb-4">Saved Themes (Slot 1 is Active)</h2>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                    {savedThemes.map((theme, index) => (
                        <ThemeHistoryItem
                            key={theme.id + index}
                            theme={theme}
                            onClick={() => handleSlotClick(index)}
                            isActive={theme.isActive}
                            isSelected={selectedSlot === index}
                        />
                    ))}
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
