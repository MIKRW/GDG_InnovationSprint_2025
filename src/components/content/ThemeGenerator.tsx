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
};

const MAX_HISTORY_LENGTH = 5;

export function ThemeGenerator() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTheme, setActiveTheme] = useState<Theme>(DEFAULTS);
  const [savedThemeId, setSavedThemeId] = useState<string | null>(null);
  const [history, setHistory] = useState<Theme[]>([]);

  // Load saved theme and history from localStorage on initial mount
  useEffect(() => {
    const savedThemeJson = localStorage.getItem('custom-theme');
    const savedHistoryJson = localStorage.getItem('custom-theme-history');
    
    let initialTheme = DEFAULTS;
    if (savedThemeJson) {
      initialTheme = JSON.parse(savedThemeJson);
      setSavedThemeId(initialTheme.id);
    }
    setActiveTheme(initialTheme);
    
    if (savedHistoryJson) {
      setHistory(JSON.parse(savedHistoryJson));
    }
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      background: '',
      foreground: '',
      primary: '',
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
  
  // This effect only updates the live preview (CSS variables)
  useEffect(() => {
    updateCSSVariables(activeTheme.colors);
  }, [activeTheme, updateCSSVariables]);
  
  // This effect only syncs history to localStorage when it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('custom-theme-history', JSON.stringify(history));
    }
  }, [history]);

  const saveTheme = () => {
    localStorage.setItem('custom-theme', JSON.stringify(activeTheme));
    localStorage.setItem('theme', 'custom');
    setSavedThemeId(activeTheme.id);
    toast({
      title: 'Theme Saved!',
      description: 'Your custom theme is now active across the app.',
    });
  };

  const selectHistoryTheme = (theme: Theme) => {
    setActiveTheme(theme);
    form.reset(theme.words);
    toast({
      title: 'Theme Previewing',
      description: 'Click "Save Theme" to make it active.',
    });
  };

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const historyColors = history.map((h) => h.colors);
      const newColors = await generateTheme({ ...values, history: historyColors });
      
      const newTheme: Theme = {
        id: uuidv4(),
        words: values,
        colors: newColors,
      };

      setActiveTheme(newTheme);
      setHistory((prev) => [newTheme, ...prev].slice(0, MAX_HISTORY_LENGTH));
      
      toast({
        title: 'Theme Generated!',
        description: 'Click "Save Theme" to make it active.',
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
        <Button onClick={saveTheme} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save Theme
        </Button>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold">History</h2>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {history.length > 0 ? (
            history.map((theme) => (
              <ThemeHistoryItem
                key={theme.id}
                theme={theme}
                isActive={activeTheme.id === theme.id}
                isSaved={savedThemeId === theme.id}
                onClick={() => selectHistoryTheme(theme)}
              />
            ))
          ) : (
            <p className="text-muted-foreground col-span-full">No themes generated yet. Try creating one!</p>
          )}
        </div>
      </div>
    </>
  );
}
