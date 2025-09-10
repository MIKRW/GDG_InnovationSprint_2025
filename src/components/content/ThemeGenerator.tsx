
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
  word1: z.string().min(2, { message: 'Please enter a word.' }),
  word2: z.string().min(2, { message: 'Please enter a word.' }),
  word3: z.string().min(2, { message: 'Please enter a word.' }),
  mood: z.string().min(2, { message: 'Please enter a word.' }),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULTS: Theme = {
  id: 'default',
  words: { word1: 'sand', word2: 'stone', word3: 'ocean', mood: 'warm' },
  colors: {
    background: { h: 39, s: 100, l: 97 },
    foreground: { h: 39, s: 50, l: 10 },
    primary: { h: 39, s: 50, l: 20 },
  },
  isActive: true,
};

const EMPTY_THEME: Theme = {
  id: 'empty',
  words: { word1: '', word2: '', word3: '', mood: '' },
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
  const [generatedTheme, setGeneratedTheme] = useState<Theme>(EMPTY_THEME);
  const [savedThemes, setSavedThemes] = useState<Theme[]>([]);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [isPreviewingGenerated, setIsPreviewingGenerated] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      word1: '',
      word2: '',
      word3: '',
      mood: '',
    },
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

  // Load saved themes from localStorage on initial mount
  useEffect(() => {
    // Load saved themes
    const savedThemesJson = localStorage.getItem('custom-themes');
    let initialThemes: Theme[] = [];
    if (savedThemesJson) {
      try {
        initialThemes = JSON.parse(savedThemesJson);
      } catch (e) {
        console.error('Failed to parse themes from localStorage', e);
        initialThemes = [];
      }
    }
    
    let hasActive = false;
    const filledThemes = Array.from({ length: MAX_SAVED_THEMES }).map((_, i) => {
        let theme = initialThemes[i];
        if (!theme) {
            theme = { ...DEFAULTS, id: uuidv4(), isActive: false };
            if (i > 0) theme.words = { word1: 'new', word2: 'theme', word3: 'slot', mood: 'default' };
        }
        
        if (theme.isActive) {
            if (hasActive) {
                theme.isActive = false;
            } else {
                hasActive = true;
                setSelectedSlot(i);
            }
        }
        return theme;
    });

    if (!hasActive && filledThemes.length > 0) {
        filledThemes[0].isActive = true;
        setSelectedSlot(0);
    }
    setSavedThemes(filledThemes);

    // Load last generated theme
    const lastGeneratedJson = localStorage.getItem('generated-theme');
    if (lastGeneratedJson) {
      try {
        const lastGenerated = JSON.parse(lastGeneratedJson);
        if(lastGenerated.id !== 'empty') {
            setGeneratedTheme(lastGenerated);
        }
      } catch (e) {
        console.error('Failed to parse generated theme from localStorage', e);
      }
    }
  }, []);

  
  // Effect to apply the active theme from savedThemes on load
  useEffect(() => {
    const activeTheme = savedThemes.find(t => t.isActive);
    if (activeTheme && !isPreviewingGenerated) {
      updateCSSVariables(activeTheme.colors);
      const currentTheme = localStorage.getItem('theme');
      if (currentTheme !== 'custom') {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add('custom');
      }
    }
  }, [savedThemes, updateCSSVariables, isPreviewingGenerated]);


  const saveToSlot = () => {
    if (generatedTheme.id === 'empty') {
      toast({
        variant: 'destructive',
        title: 'No Generated Theme',
        description: 'Please generate a theme before trying to save.',
      });
      return;
    }

    const newSavedThemes = savedThemes.map((theme, index) => {
      if (index === selectedSlot) {
        const newTheme = { ...generatedTheme, id: uuidv4(), isActive: theme.isActive };
        if (newTheme.isActive) {
          updateCSSVariables(newTheme.colors);
          localStorage.setItem('theme', 'custom');
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add('custom');
          setIsPreviewingGenerated(false);
        }
        return newTheme;
      }
      return theme;
    });

    setSavedThemes(newSavedThemes);
    localStorage.setItem('custom-themes', JSON.stringify(newSavedThemes));

    toast({
      title: 'Theme Saved!',
      description: `Generated theme saved to slot ${selectedSlot + 1}.`,
    });
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

      setGeneratedTheme(newTheme);
      localStorage.setItem('generated-theme', JSON.stringify(newTheme));
      
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
    const themeToActivate = savedThemes[index];
    
    const newSavedThemes = savedThemes.map((theme, i) => ({
      ...theme,
      isActive: i === index,
    }));
    
    setSelectedSlot(index);
    setSavedThemes(newSavedThemes);
    localStorage.setItem('custom-themes', JSON.stringify(newSavedThemes));
    localStorage.setItem('theme', 'custom');
    updateCSSVariables(themeToActivate.colors);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add('custom');
    setIsPreviewingGenerated(false);
    form.reset(themeToActivate.words);
  }

  const previewGeneratedTheme = () => {
    if (generatedTheme.id === 'empty') return;
    updateCSSVariables(generatedTheme.colors);
    localStorage.setItem('theme', 'custom');
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add('custom');
    setIsPreviewingGenerated(true);
    // Unselect any saved slots
    const newSavedThemes = savedThemes.map(theme => ({ ...theme, isActive: false }));
    setSavedThemes(newSavedThemes);
  }

  const rotateGeneratedTheme = () => {
    if (generatedTheme.id === 'empty') return;

    const currentColors = generatedTheme.colors;
    const newColors = {
        background: currentColors.foreground,
        foreground: currentColors.primary,
        primary: currentColors.background
    };

    const newTheme = {...generatedTheme, colors: newColors};

    setGeneratedTheme(newTheme);
    localStorage.setItem('generated-theme', JSON.stringify(newTheme));

    if (isPreviewingGenerated) {
        updateCSSVariables(newColors);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <FormField
              control={form.control}
              name="word1"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Word 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="word2"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Word 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="word3"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Word 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="mood" {...field} />
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
        <Button onClick={saveToSlot} size="lg" disabled={generatedTheme.id === 'empty'}>
          <Save className="mr-2 h-4 w-4" />
          Save Generated Theme to Selected Slot
        </Button>
      </div>

      <div className="mt-12">
        <Separator className="my-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className='lg:col-span-1'>
                <h2 className="text-2xl font-bold text-center mb-4">Generated Theme</h2>
                <ThemeHistoryItem
                    theme={generatedTheme}
                    onClick={previewGeneratedTheme}
                    onRotateClick={rotateGeneratedTheme}
                    showRotate={isPreviewingGenerated}
                    isEmpty={generatedTheme.id === 'empty'}
                    emptyText="Generate a new theme to see it here."
                    isSelected={isPreviewingGenerated}
                />
            </div>
            <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-center mb-4">Saved Themes (Click to activate)</h2>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                    {savedThemes.map((theme, index) => {
                      const isActive = theme.isActive;
                      return (
                        <ThemeHistoryItem
                            key={theme.id + index}
                            theme={theme}
                            onClick={() => handleSlotClick(index)}
                            isActive={isActive}
                            isSelected={!isPreviewingGenerated && selectedSlot === index}
                        />
                      )
                    })}
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
