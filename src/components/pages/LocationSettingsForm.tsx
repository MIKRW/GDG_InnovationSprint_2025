
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { PageTitle } from '@/components/content/PageTitle';
import type { LocationSettings } from '@/lib/types';

const FormSchema = z.object({
  mode: z.enum(['device', 'manual', 'privacy']),
  manual: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
  }),
  privacy: z.object({
    isOutside: z.boolean(),
  }),
});

const LOCATION_SETTINGS_KEY = 'location-settings';

export function LocationSettingsForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      mode: 'device',
      manual: { latitude: 0, longitude: 0 },
      privacy: { isOutside: true },
    },
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem(LOCATION_SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        form.reset(parsedSettings);
      } catch (error) {
        console.error('Failed to parse location settings:', error);
      }
    }
  }, [form]);

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    localStorage.setItem(LOCATION_SETTINGS_KEY, JSON.stringify(data));
    toast({
      title: 'Settings Saved',
      description: 'Your location preferences have been updated.',
    });
  };

  const selectedMode = form.watch('mode');

  return (
    <div className="container mx-auto">
      <PageTitle>Location Services</PageTitle>
      <p className="mb-6 max-w-2xl text-muted-foreground">
        Choose how this app uses your location. Providing accurate location data
        can significantly improve bird identification.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Controller
          control={form.control}
          name="mode"
          render={({ field }) => (
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="grid grid-cols-1 gap-4 md:grid-cols-3"
            >
              {/* Option 1: Device Location */}
              <Label htmlFor="device-mode" className="cursor-pointer">
                <Card className={field.value === 'device' ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value="device" id="device-mode" />
                      <CardTitle>Device Location</CardTitle>
                    </div>
                    <CardDescription className="pt-2">
                      Use your device's GPS for the most accurate location. Ideal for fieldwork.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Label>

              {/* Option 2: Manual Location */}
              <Label htmlFor="manual-mode" className="cursor-pointer">
                <Card className={field.value === 'manual' ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value="manual" id="manual-mode" />
                      <CardTitle>Manual Location</CardTitle>
                    </div>
                     <CardDescription className="pt-2">
                      Manually enter coordinates. Useful for logging past recordings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                     <Controller
                        control={form.control}
                        name="manual.latitude"
                        render={({ field: latField }) => (
                           <Input {...latField} type="number" placeholder="Latitude (e.g., 40.7128)" disabled={selectedMode !== 'manual'} />
                        )}
                     />
                      <Controller
                        control={form.control}
                        name="manual.longitude"
                        render={({ field: lonField }) => (
                           <Input {...lonField} type="number" placeholder="Longitude (e.g., -74.0060)" disabled={selectedMode !== 'manual'} />
                        )}
                     />
                  </CardContent>
                </Card>
              </Label>

              {/* Option 3: Privacy Mode */}
              <Label htmlFor="privacy-mode" className="cursor-pointer">
                <Card className={field.value === 'privacy' ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                        <RadioGroupItem value="privacy" id="privacy-mode" />
                        <CardTitle>Privacy Mode</CardTitle>
                    </div>
                     <CardDescription className="pt-2">
                      No location is shared. Just specify if you're inside or outside.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="inside-outside-switch">Inside</Label>
                       <Controller
                          control={form.control}
                          name="privacy.isOutside"
                          render={({ field: switchField }) => (
                            <Switch
                                id="inside-outside-switch"
                                checked={switchField.value}
                                onCheckedChange={switchField.onChange}
                                disabled={selectedMode !== 'privacy'}
                             />
                          )}
                        />
                      <Label htmlFor="inside-outside-switch">Outside</Label>
                    </div>
                  </CardContent>
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
