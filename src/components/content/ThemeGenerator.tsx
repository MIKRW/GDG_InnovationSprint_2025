'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateTheme } from '@/ai/flows/generate-theme-flow';
import type { ThemeColor, Theme } from '@/lib/types';
import { Loader2 } from 'lucide-react';
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
  const [history, setHistory] = useState<Theme[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('custom-theme');
    const savedHistory = localStorage.getItem('custom-theme-history');

    if (savedTheme) {
      setActiveTheme(JSON.parse(savedTheme));
    }
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: activeTheme.words,
  });

  useEffect(() => {
    form.reset(activeTheme.words);
  }, [activeTheme.words, form]);

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

  const saveToLocalStorage = useCallback((theme: Theme, themeHistory: Theme[]) => {
    localStorage.setItem('custom-theme', JSON.stringify(theme));
    localStorage.setItem('custom-theme-history', JSON.stringify(themeHistory));
  }, []);

  useEffect(() => {
    updateCSSVariables(activeTheme.colors);
    saveToLocalStorage(activeTheme, history);
  }, [activeTheme, history, updateCSSVariables, saveToLocalStorage]);

  const selectHistoryTheme = (theme: Theme) => {
    setActiveTheme(theme);
    toast({
      title: 'Theme Switched!',
      description: 'Loaded a theme from your history.',
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
        description: 'Your new custom theme has been applied.',
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
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="background"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background Word</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., sand, sky, forest" {...field} />
                  </FormControl>
                  <FormDescription>A word to inspire the background color.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="foreground"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foreground Word</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., stone, ink, snow" {...field} />
                  </FormControl>
                  <FormDescription>A word to inspire the text and icon color.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Word</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ocean, sunset, gold" {...field} />
                  </FormControl>
                  <FormDescription>A word to inspire the main accent color for buttons.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Theme'
            )}
          </Button>
        </form>
      </Form>

      {history.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold">History</h2>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {history.map((theme) => (
              <ThemeHistoryItem
                key={theme.id}
                theme={theme}
                isActive={activeTheme.id === theme.id}
                onClick={() => selectHistoryTheme(theme)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
