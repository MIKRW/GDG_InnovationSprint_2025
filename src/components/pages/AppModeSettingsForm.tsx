
'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PageTitle } from '@/components/content/PageTitle';
import type { AppMode } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const FormSchema = z.object({
  mode: z.enum(['newbie', 'twitcher']),
});

const APP_MODE_SETTINGS_KEY = 'app-mode-settings';

export function AppModeSettingsForm() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      mode: 'newbie',
    },
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem(APP_MODE_SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        // Ensure that a disabled mode isn't loaded from old settings
        if (parsedSettings.mode === 'twitcher') {
            parsedSettings.mode = 'newbie';
        }
        form.reset(parsedSettings);
      } catch (error) {
        console.error('Failed to parse app mode settings:', error);
      }
    }
  }, [form]);

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    localStorage.setItem(APP_MODE_SETTINGS_KEY, JSON.stringify(data));
    toast({
      title: 'Settings Saved',
      description: 'Your app mode preference has been updated.',
    });
  };

  const selectedMode = form.watch('mode');

  return (
    <div className="container mx-auto">
        <PageTitle>App Mode</PageTitle>
        <p className="mb-6 max-w-2xl text-muted-foreground">
            Choose the experience that best suits your needs. Your selection will enable different sets of features.
        </p>

        <Alert variant="default" className="mb-8 bg-blue-50 border-blue-200 text-blue-800">
            <Info className="h-4 w-4 !text-blue-800" />
            <AlertTitle>Under Development</AlertTitle>
            <AlertDescription>
            App Modes are currently being developed. Selecting a mode will save your preference for future updates, but will not change app functionality at this time.
            </AlertDescription>
        </Alert>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Controller
            control={form.control}
            name="mode"
            render={({ field }) => (
                <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                <Label htmlFor="newbie-mode" className="cursor-pointer h-full">
                    <Card className={cn('h-full', field.value === 'newbie' && 'ring-2 ring-primary')}>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                        <RadioGroupItem value="newbie" id="newbie-mode" />
                        <CardTitle>Newbie Mode</CardTitle>
                        </div>
                        <CardDescription className="pt-2">
                        A simplified experience for beginners and the general public, focusing on ease of use and core features.
                        </CardDescription>
                    </CardHeader>
                    </Card>
                </Label>

                <Label htmlFor="twitcher-mode" className="h-full cursor-not-allowed">
                    <Card className="h-full bg-muted/50">
                    <CardHeader className="opacity-50">
                        <div className="flex items-center gap-4">
                        <RadioGroupItem value="twitcher" id="twitcher-mode" disabled />
                        <CardTitle>Twitcher Mode</CardTitle>
                        </div>
                        <CardDescription className="pt-2">
                        An advanced mode for researchers and enthusiasts with more precise controls and data handling, such as higher quality audio formats.
                        </CardDescription>
                    </CardHeader>
                    </Card>
                </Label>
                </RadioGroup>
            )}
            />
            <Button type="submit">Save Settings</Button>
        </form>
    </div>
  );
}
