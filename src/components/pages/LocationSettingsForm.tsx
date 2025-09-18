
'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

const FormSchema = z.object({
  mode: z.enum(['device', 'manual', 'description', 'privacy']),
  manual: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
  }),
  description: z.string().max(200),
  privacy: z.object({
    isOutside: z.boolean(),
  }),
});

const LOCATION_SETTINGS_KEY = 'location-settings';

export function LocationSettingsForm() {
  const { toast } = useToast();
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      mode: 'device',
      manual: { latitude: 0, longitude: 0 },
      description: '',
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

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        setPermissionStatus(status.state);
        status.onchange = () => setPermissionStatus(status.state);
      });
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
        <div className="flex items-center gap-4">
            <PageTitle>Location Services</PageTitle>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Learn more about location settings">
                        <Info className="h-6 w-6" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>How the AI Uses Location Data</DialogTitle>
                        <DialogDescription>
                            Providing location data is optional but can significantly improve the accuracy of bird identification. Here’s how the AI is instructed to use each type of data:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <div>
                            <h3 className="font-semibold text-foreground">Device & Manual Location (Coordinates)</h3>
                            <p>If you provide GPS coordinates, the AI treats this as an absolute location. It cross-references this precise point with scientific databases and ornithological field guides to determine the expected bird species for that specific habitat and geographic range.</p>
                        </div>
                         <div>
                            <h3 className="font-semibold text-foreground">Location Description (Text)</h3>
                            <p>If you describe a location (e.g., "Yosemite National Park"), the AI uses this text as a strong hint. It identifies the geographical area and then researches which birds are commonly found there, prioritizing reliable sources like government databases and academic research over general public information.</p>
                        </div>
                         <div>
                            <h3 className="font-semibold text-foreground">Privacy Mode</h3>
                            <p>In this mode, no location data is sent to the AI. Identification is based solely on the audio recording itself, which may be less accurate as it lacks geographical context.</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
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
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              {/* Option 1: Device Location */}
              <Label htmlFor="device-mode" className="cursor-pointer h-full">
                <Card className={`h-full ${field.value === 'device' ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value="device" id="device-mode" />
                      <CardTitle>Device Location</CardTitle>
                    </div>
                    <CardDescription className="pt-2">
                      Use your device's GPS for the most accurate location. Ideal for fieldwork.
                    </CardDescription>
                  </CardHeader>
                   {selectedMode === 'device' && permissionStatus === 'denied' && (
                    <CardFooter>
                        <Alert variant="destructive" className="border-amber-500/50 text-amber-500 [&>svg]:text-amber-500">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Permission Denied</AlertTitle>
                          <AlertDescription>
                            Please enable location access in your browser settings to use this feature.
                          </AlertDescription>
                        </Alert>
                    </CardFooter>
                   )}
                </Card>
              </Label>

              {/* Option 2: Manual Location */}
              <Label htmlFor="manual-mode" className="cursor-pointer h-full">
                <Card className={`h-full ${field.value === 'manual' ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value="manual" id="manual-mode" />
                      <CardTitle>Manual Location</CardTitle>
                    </div>
                     <CardDescription className="pt-2">
                      Manually enter coordinates. Make sure they are accurate as the AI will use this as an absolute location.
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

              {/* Option 3: Location Description */}
              <Label htmlFor="description-mode" className="cursor-pointer h-full">
                 <Card className={`h-full ${field.value === 'description' ? 'ring-2 ring-primary' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                          <RadioGroupItem value="description" id="description-mode" />
                          <CardTitle>Location Description</CardTitle>
                      </div>
                       <CardDescription className="pt-2">
                        Describe the location (e.g., town, national park, postcode).
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Controller
                          control={form.control}
                          name="description"
                          render={({ field: descField }) => (
                              <Textarea
                                {...descField}
                                placeholder="e.g., 'Yosemite National Park, CA' or 'SW1A 0AA'"
                                disabled={selectedMode !== 'description'}
                              />
                          )}
                        />
                    </CardContent>
                 </Card>
              </Label>

              {/* Option 4: Privacy Mode */}
              <Label htmlFor="privacy-mode" className="cursor-pointer h-full">
                <Card className={`h-full ${field.value === 'privacy' ? 'ring-2 ring-primary' : ''}`}>
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
