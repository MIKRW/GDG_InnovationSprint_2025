'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { debounce } from 'lodash';

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
import type { ThemeColor } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  background: z.string().min(2, { message: 'Please enter a word.' }),
  foreground: z.string().min(2, { message: 'Please enter a word.' }),
  primary: z.string().min(2, { message: 'Please enter a word.' }),
});

const DEFAULTS = {
  background: { h: 39, s: 100, l: 97 },
  foreground: { h: 39, s: 50, l: 10 },
  primary: { h: 39, s: 50, l: 20 },
};

export function ThemeGenerator() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [colors, setColors] = useState({
    background: DEFAULTS.background,
    foreground: DEFAULTS.foreground,
    primary: DEFAULTS.primary,
  });

  useEffect(() => {
    const savedBg = localStorage.getItem('custom-theme-background');
    const savedFg = localStorage.getItem('custom-theme-foreground');
    const savedPri = localStorage.getItem('custom-theme-primary');

    setColors({
      background: savedBg ? JSON.parse(savedBg) : DEFAULTS.background,
      foreground: savedFg ? JSON.parse(savedFg) : DEFAULTS.foreground,
      primary: savedPri ? JSON.parse(savedPri) : DEFAULTS.primary,
    });
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      background: 'sand',
      foreground: 'stone',
      primary: 'ocean',
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateCSSVariables = useCallback(
    debounce((newColors: { background: ThemeColor; foreground: ThemeColor; primary: ThemeColor }) => {
      const root = document.documentElement;
      root.style.setProperty('--custom-background-h', `${newColors.background.h}`);
      root.style.setProperty('--custom-background-s', `${newColors.background.s}%`);
      root.style.setProperty('--custom-background-l', `${newColors.background.l}%`);

      root.style.setProperty('--custom-foreground-h', `${newColors.foreground.h}`);
      root.style.setProperty('--custom-foreground-s', `${newColors.foreground.s}%`);
      root.style.setProperty('--custom-foreground-l', `${newColors.foreground.l}%`);

      root.style.setProperty('--custom-primary-h', `${newColors.primary.h}`);
      root.style.setProperty('--custom-primary-s', `${newColors.primary.s}%`);
      root.style.setProperty('--custom-primary-l', `${newColors.primary.l}%`);
    }, 150),
    []
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveToLocalStorage = useCallback(
    debounce((newColors: { background: ThemeColor; foreground: ThemeColor; primary: ThemeColor }) => {
      localStorage.setItem('custom-theme-background', JSON.stringify(newColors.background));
      localStorage.setItem('custom-theme-foreground', JSON.stringify(newColors.foreground));
      localStorage.setItem('custom-theme-primary', JSON.stringify(newColors.primary));
    }, 500),
    []
  );

  useEffect(() => {
    updateCSSVariables(colors);
    saveToLocalStorage(colors);
  }, [colors, updateCSSVariables, saveToLocalStorage]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const newTheme = await generateTheme(values);
      setColors(newTheme);
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
              <FormDescription>
                A word to inspire the background color.
              </FormDescription>
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
               <FormDescription>
                A word to inspire the text and icon color.
              </FormDescription>
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
               <FormDescription>
                A word to inspire the main accent color for buttons.
              </FormDescription>
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
  );
}
