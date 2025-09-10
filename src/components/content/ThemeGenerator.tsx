
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
import { Info, Loader2, RefreshCw, Save } from 'lucide-react';
import { ThemeHistoryItem } from './ThemeHistoryItem';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  word1: z.string(),
  word2: z.string(),
  word3: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULTS: Theme = {
  id: 'default',
  words: { word1: 'sand', word2: 'stone', word3: 'ocean', mood: 'warm' },
  colors: {
    background: { h: 39, s: 100, l: 97 },
    foreground: { h: 39, s: 50, l: 10 },
    primary: { h: 39, s: 50, l: 20 },
    ring: { h: 39, s: 50, l: 30 },
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
    ring: { h: 0, s: 0, l: 60 },
  },
  isActive: false,
};

const MOODS = ['Vibrant', 'Calm', 'High Contrast', 'Tritanopia-Friendly', 'Deuteranopia-Friendly', 'Protanopia-Friendly', 'Minimalist', '80s Retro', 'Dark'];

const MAX_SAVED_THEMES = 6;

export function ThemeGenerator() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmptyInputInfo, setShowEmptyInputInfo] = useState(false);
  const [generatedTheme, setGeneratedTheme] = useState<Theme>(EMPTY_THEME);
  const [savedThemes, setSavedThemes] = useState<Theme[]>([]);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [isPreviewingGenerated, setIsPreviewingGenerated] = useState(false);
  const [currentMoodIndex, setCurrentMoodIndex] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      word1: '',
      word2: '',
      word3: '',
    },
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue(e.target.name as keyof FormValues, e.target.value);
    if (showEmptyInputInfo) {
      setShowEmptyInputInfo(false);
    }
  }

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
    root.style.setProperty('--custom-ring-h', `${colors.ring.h}`);
    root.style.setProperty('--custom-ring-s', `${colors.ring.s}%`);
    root.style.setProperty('--custom-ring-l', `${colors.ring.l}%`);
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
    form.reset({ word1: '', word2: '', word3: '' });
  };


  async function onSubmit(values: FormValues) {
    setIsLoading(true);

    if (!values.word1 && !values.word2 && !values.word3) {
      setShowEmptyInputInfo(true);
    } else {
      setShowEmptyInputInfo(false);
    }
    
    const mood = MOODS[currentMoodIndex];
    try {
      const newColors = await generateTheme({ ...values, mood });
      
      const newTheme: Theme = {
        id: uuidv4(),
        words: { ...values, mood },
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
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded')) {
        toast({
            variant: 'destructive',
            title: 'AI Model Busy',
            description: 'The theme generator is currently busy. Please try again in a moment.',
        });
      } else {
        toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description: 'Could not generate the theme. Please try again.',
        });
      }
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
    setShowEmptyInputInfo(false);

    const activeMoodIndex = MOODS.indexOf(themeToActivate.words.mood);
    setCurrentMoodIndex(activeMoodIndex >= 0 ? activeMoodIndex : 0);

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
        primary: currentColors.background,
        ring: currentColors.ring,
    };

    const newTheme = {...generatedTheme, colors: newColors};

    setGeneratedTheme(newTheme);
localStorage.setItem('generated-theme', JSON.stringify(newTheme));

    if (isPreviewingGenerated) {
        updateCSSVariables(newColors);
    }
  };

  const rotateMood = () => {
    setCurrentMoodIndex((prevIndex) => (prevIndex + 1) % MOODS.length);
  };

  return (
    <>
      <div className="mt-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
             {showEmptyInputInfo && (
              <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800 md:col-span-4">
                <Info className="h-4 w-4 !text-blue-800" />
                <AlertDescription>
                  To generate your own theme, enter some descriptive words below.
                </AlertDescription>
              </Alert>
            )}
              <FormField
                control={form.control}
                name="word1"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="type here" {...field} onChange={handleInputChange} />
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
                      <Input placeholder="type here" {...field} onChange={handleInputChange} />
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
                      <Input placeholder="type here" {...field} onChange={handleInputChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="outline" onClick={rotateMood}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {MOODS[currentMoodIndex]}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 items-stretch gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-40 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Theme'
                )}
              </Button>
              <div className="h-40">
                <ThemeHistoryItem
                  theme={generatedTheme}
                  onClick={previewGeneratedTheme}
                  onRotateClick={rotateGeneratedTheme}
                  showRotate={generatedTheme.id !== 'empty'}
                  isEmpty={generatedTheme.id === 'empty'}
                  emptyText="Generate a new theme to see it here."
                  isSelected={isPreviewingGenerated}
                />
              </div>
              <Button
                onClick={saveToSlot}
                disabled={generatedTheme.id === 'empty'}
                className="w-full h-40 text-lg"
              >
                <Save className="mr-2 h-4 w-4" />
                Save to Slot
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="mt-12">
        <Separator className="my-4" />
        <h2 className="text-2xl font-bold text-center mb-4">
          Saved Themes (Click to activate)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {savedThemes.map((theme, index) => {
            const isActive = theme.isActive;
            return (
              <div key={theme.id + index} className="h-40">
                <ThemeHistoryItem
                  theme={theme}
                  onClick={() => handleSlotClick(index)}
                  isActive={isActive}
                  isSelected={!isPreviewingGenerated && selectedSlot === index}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
