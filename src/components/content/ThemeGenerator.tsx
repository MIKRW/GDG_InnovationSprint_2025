
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';

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
import type { Theme, ThemeColor } from '@/lib/types';
import { Info, Loader2, RefreshCw, Save } from 'lucide-react';
import { ThemeHistoryItem } from './ThemeHistoryItem';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { ManualThemeEditor } from './ManualThemeEditor';
import { PageTitle } from '../content/PageTitle';
import { db } from '@/lib/firebase';

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

const MANUAL_DEFAULT: Theme = {
    id: 'manual-default',
    words: { word1: 'custom', word2: 'edited', word3: 'theme', mood: 'manual' },
    colors: {
        background: { h: 210, s: 20, l: 95 },
        foreground: { h: 210, s: 20, l: 15 },
        primary: { h: 210, s: 30, l: 40 },
        ring: { h: 210, s: 30, l: 50 },
    },
    isActive: false,
};


const MOODS = ['Vibrant', 'Calm', 'High Contrast', 'Tritanopia-Friendly', 'Deuteranopia-Friendly', 'Protanopia-Friendly', 'Minimalist', '80s Retro', 'Dark'];

const MAX_SAVED_THEMES = 6;

export function ThemeGenerator() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isApiOverloaded, setIsApiOverloaded] = useState(false);
  const [showEmptyInputInfo, setShowEmptyInputInfo] = useState(false);
  const [generatedTheme, setGeneratedTheme] = useState<Theme>(EMPTY_THEME);
  const [savedThemes, setSavedThemes] = useState<Theme[]>([]);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [isPreviewingGenerated, setIsPreviewingGenerated] = useState(false);
  const [isPreviewingManual, setIsPreviewingManual] = useState(false);
  const [currentMoodIndex, setCurrentMoodIndex] = useState(0);
  const [manualTheme, setManualTheme] = useState<Theme>(MANUAL_DEFAULT);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);

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
    const ringColor = colors.ring || colors.primary;

    root.style.setProperty('--custom-background-h', `${colors.background.h}`);
    root.style.setProperty('--custom-background-s', `${colors.background.s}%`);
    root.style.setProperty('--custom-background-l', `${colors.background.l}%`);
    root.style.setProperty('--custom-foreground-h', `${colors.foreground.h}`);
    root.style.setProperty('--custom-foreground-s', `${colors.foreground.s}%`);
    root.style.setProperty('--custom-foreground-l', `${colors.foreground.l}%`);
    root.style.setProperty('--custom-primary-h', `${colors.primary.h}`);
    root.style.setProperty('--custom-primary-s', `${colors.primary.s}%`);
    root.style.setProperty('--custom-primary-l', `${colors.primary.l}%`);
    root.style.setProperty('--custom-ring-h', `${ringColor.h}`);
    root.style.setProperty('--custom-ring-s', `${ringColor.s}%`);
    root.style.setProperty('--custom-ring-l', `${ringColor.l}%`);
  }, []);

    // Load themes from LocalStorage
    useEffect(() => {
        setIsFirestoreLoading(true);
        const themesFromStorage: Record<string, Theme> = {};
        for(let i = 0; i < MAX_SAVED_THEMES; i++) {
            const themeJson = localStorage.getItem(`theme-slot-${i}`);
            if (themeJson) {
                try {
                    themesFromStorage[i.toString()] = JSON.parse(themeJson);
                } catch (e) {
                    console.error(`Failed to parse theme from slot ${i}`, e);
                }
            }
        }

        let hasActive = false;
        const filledThemes = Array.from({ length: MAX_SAVED_THEMES }).map((_, i) => {
          let theme = themesFromStorage[i.toString()];
          if (!theme) {
            theme = { ...DEFAULTS, id: uuidv4(), isActive: i === 0 };
            if (i > 0) theme.words = { word1: 'new', word2: 'theme', word3: 'slot', mood: 'default' };
          }
          if (theme.isActive) {
            if (hasActive) theme.isActive = false;
            else {
              hasActive = true;
              setSelectedSlot(i);
              localStorage.setItem('active-theme-json', JSON.stringify(theme));
              updateCSSVariables(theme.colors);
            }
          }
          return theme;
        });

        if (!hasActive && filledThemes.length > 0) {
          filledThemes[0].isActive = true;
          setSelectedSlot(0);
          localStorage.setItem('active-theme-json', JSON.stringify(filledThemes[0]));
          updateCSSVariables(filledThemes[0].colors);
        }

        setSavedThemes(filledThemes);
        setIsFirestoreLoading(false);
    
        const lastGeneratedJson = localStorage.getItem('generated-theme');
        if (lastGeneratedJson) {
            try {
                const lastGenerated = JSON.parse(lastGeneratedJson);
                if(lastGenerated.id !== 'empty') {
                    setGeneratedTheme(lastGenerated);
                }
            } catch (e) { console.error('Failed to parse generated theme', e); }
        }
    
        const manualThemeJson = localStorage.getItem('manual-theme');
        if (manualThemeJson) {
            try {
                setManualTheme(JSON.parse(manualThemeJson));
            } catch (e) { console.error('Failed to parse manual theme', e); }
        }

    }, [updateCSSVariables]);


  useEffect(() => {
    const handlePreviewExit = () => {
        setIsPreviewingGenerated(false);
        setIsPreviewingManual(false);
        const activeThemeJson = localStorage.getItem('active-theme-json');
        if (activeThemeJson) {
            try {
              const activeTheme = JSON.parse(activeThemeJson);
              updateCSSVariables(activeTheme.colors);
            } catch(e) {
              console.error("Failed to parse active theme from localStorage", e);
            }
        }
    };
    window.addEventListener('preview-exit', handlePreviewExit);
    return () => {
        window.removeEventListener('preview-exit', handlePreviewExit);
    };
  }, [updateCSSVariables]);

  
  const saveThemeToSlot = async (themeToSave: Theme) => {
    if (!themeToSave || themeToSave.id === 'empty') {
      toast({
        variant: 'destructive',
        title: 'No Theme to Save',
        description: 'Please generate or edit a theme before saving.',
      });
      return;
    }
  
    const themeToSaveToSlot = { ...themeToSave, id: uuidv4(), isActive: false };
    const newSavedThemes = savedThemes.map((theme, index) => 
        index === selectedSlot ? themeToSaveToSlot : theme
    );

    setSavedThemes(newSavedThemes);

    try {
        localStorage.setItem(`theme-slot-${selectedSlot}`, JSON.stringify(themeToSaveToSlot));
        
        if(savedThemes[selectedSlot]?.isActive) {
            updateCSSVariables(themeToSaveToSlot.colors);
            localStorage.setItem('active-theme-json', JSON.stringify(themeToSaveToSlot));
        }

        toast({
          title: 'Theme Saved!',
          description: `Theme saved to slot ${selectedSlot + 1}.`,
        });
    } catch (error) {
        console.error("Error saving theme to LocalStorage: ", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save theme to LocalStorage.' });
    }
  
    if (isPreviewingGenerated || isPreviewingManual) {
        setIsPreviewingGenerated(false);
        setIsPreviewingManual(false);
        sessionStorage.removeItem('theme-preview-active');
    }
  };


  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setIsApiOverloaded(false);

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
        setIsApiOverloaded(true);
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

  const handleSlotClick = async (index: number) => {
    const themeToActivate = savedThemes[index];
    if (!themeToActivate) return;
  
    const newSavedThemes = savedThemes.map((theme, i) => ({
      ...theme,
      isActive: i === index,
    }));
    setSelectedSlot(index);
    setSavedThemes(newSavedThemes);
  
    updateCSSVariables(themeToActivate.colors);
    localStorage.setItem('active-theme-json', JSON.stringify(themeToActivate));
    localStorage.setItem('theme', 'custom');
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add('custom');
  
    try {
      for (let i = 0; i < newSavedThemes.length; i++) {
        localStorage.setItem(`theme-slot-${i}`, JSON.stringify(newSavedThemes[i]));
      }
    } catch (error) {
      console.error("Error updating active theme in LocalStorage: ", error);
    }
  
    setIsPreviewingGenerated(false);
    setIsPreviewingManual(false);
    sessionStorage.removeItem('theme-preview-active');
    setShowEmptyInputInfo(false);
  
    const activeMoodIndex = MOODS.indexOf(themeToActivate.words.mood);
    setCurrentMoodIndex(activeMoodIndex >= 0 ? activeMoodIndex : 0);
    form.reset(themeToActivate.words);
  };

  const startPreview = (theme: Theme) => {
    updateCSSVariables(theme.colors);
    localStorage.setItem('theme', 'custom');
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add('custom');
    sessionStorage.setItem('theme-preview-active', 'true');
    const newSavedThemes = savedThemes.map(t => ({ ...t, isActive: false }));
    setSavedThemes(newSavedThemes);
  }

  const previewGeneratedTheme = () => {
    if (generatedTheme.id === 'empty') return;
    startPreview(generatedTheme);
    setIsPreviewingGenerated(true);
    setIsPreviewingManual(false);
  }

  const previewManualTheme = () => {
    if (manualTheme.id === 'manual-default' && manualTheme.colors.background.h === 210) return;
    startPreview(manualTheme);
    setIsPreviewingManual(true);
    setIsPreviewingGenerated(false);
  }

  useEffect(() => {
    if (isPreviewingManual) {
        updateCSSVariables(manualTheme.colors);
    }
  }, [manualTheme, isPreviewingManual, updateCSSVariables]);


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

  const rotateManualTheme = () => {
    const currentColors = manualTheme.colors;
    const newColors = {
        background: currentColors.foreground,
        foreground: currentColors.primary,
        primary: currentColors.background,
        ring: currentColors.ring,
    };
    const newTheme = {...manualTheme, colors: newColors};
    setManualTheme(newTheme);
localStorage.setItem('manual-theme', JSON.stringify(newTheme));
    if(isPreviewingManual) {
        updateCSSVariables(newColors);
    }
  };

  const rotateMood = () => {
    setCurrentMoodIndex((prevIndex) => (prevIndex + 1) % MOODS.length);
  };
  
  const handleManualColorChange = (colorName: keyof Theme['colors'], newColor: ThemeColor) => {
    const updatedTheme = {
        ...manualTheme,
        colors: {
            ...manualTheme.colors,
            [colorName]: newColor,
        },
    };
    setManualTheme(updatedTheme);
    localStorage.setItem('manual-theme', JSON.stringify(updatedTheme));
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
              <Button type="button" onClick={rotateMood}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {MOODS[currentMoodIndex]}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 items-stretch gap-4 mt-8">
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
                ) : isApiOverloaded ? (
                  'AI Busy, Try Again'
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
                type="button"
                onClick={() => saveThemeToSlot(generatedTheme)}
                disabled={generatedTheme.id === 'empty'}
                className="w-full h-40 text-lg"
              >
                <Save className="mr-2 h-4 w-4" />
                Save AI Theme
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="my-8">
        <h2 className="text-6xl font-bold text-center mb-16">
          Favorite Themes
        </h2>
        {isFirestoreLoading ? (
            <div className="flex justify-center items-center h-28">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : (
            <div className="grid grid-cols-6 gap-4">
            {savedThemes.map((theme, index) => {
                const isActive = theme.isActive;
                return (
                <div key={theme.id + index} className="h-28">
                    <ThemeHistoryItem
                    theme={theme}
                    onClick={() => handleSlotClick(index)}
                    isActive={isActive}
                    isSelected={!isPreviewingGenerated && !isPreviewingManual && selectedSlot === index}
                    />
                </div>
                );
            })}
            </div>
        )}
      </div>
      
      <div className="my-24">
        <div className="text-center mb-12">
            <PageTitle>Manual theme editor</PageTitle>
            <p className="text-foreground mt-4 max-w-2xl mx-auto">
                Fine-tune your theme with precision. Select a color swatch for background, foreground, or primary, then adjust the hue, saturation, and lightness sliders. Rotate colors, preview your changes, and save your perfect theme.
            </p>
        </div>
          <ManualThemeEditor 
              theme={manualTheme}
              onColorChange={handleManualColorChange}
              onRotate={rotateManualTheme}
              onSave={() => saveThemeToSlot(manualTheme)}
              onPreview={previewManualTheme}
              isPreviewing={isPreviewingManual}
          />
      </div>
    </>
  );
}
