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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateTheme } from '@/ai/flows/generate-theme-flow';
import type { ThemeColor } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: 'Please enter a description of at least 10 characters.',
  }),
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
      prompt: '',
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
      const newTheme = await generateTheme(values.prompt);
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
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Theme Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., a tranquil beach at sunset with soft pinks and oranges"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Describe the look and feel you want for your custom theme.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
