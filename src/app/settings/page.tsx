

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/content/PageTitle';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BookImage, Home, Save, Settings } from 'lucide-react';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';

const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';

export default function SettingsPage() {
  const { toast } = useToast();
  const [hardware, setHardware] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedHardware = localStorage.getItem(HARDWARE_SETTINGS_KEY);
    if (savedHardware) {
      setHardware(savedHardware);
    }
  }, []);
  
  const handleSaveHardware = () => {
    if (hardware) {
      localStorage.setItem(HARDWARE_SETTINGS_KEY, hardware);
      toast({
        title: 'Settings Saved',
        description: 'Your recording hardware preference has been updated.',
      });
    }
  };

  return (
    <AppLayout>
      <main className="flex-1 flex flex-col items-center justify-center p-4 bg-muted relative">
        <div className="absolute top-4 left-4 opacity-50">
            <SpeakerButton />
        </div>
        <div className="absolute top-4 right-4 opacity-50">
            <ContrastButton />
        </div>
        
        <div className="container mx-auto text-center">
          <PageTitle>Settings</PageTitle>
          <div className="space-y-4 flex flex-col items-center">
            <p className="text-muted-foreground max-w-md">
              Customize the look, feel, and functionality of your application.
            </p>
            <Button asChild variant="outline">
              <Link href="/theme">Customize Theme</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/location">Location Settings</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/mode">App Mode</Link>
            </Button>

            <div className="pt-8 w-full max-w-sm">
                <h2 className="text-lg font-semibold mb-2">Recording</h2>
                <div className="space-y-2">
                    <Label htmlFor="hardware-input">Recording Hardware</Label>
                    <Input
                        id="hardware-input"
                        value={hardware}
                        onChange={(e) => setHardware(e.target.value)}
                        placeholder="e.g., iPhone 15 Pro, Rode NTG"
                    />
                    <p className="text-sm text-muted-foreground">
                        Optionally, specify the microphone you use for recording.
                    </p>
                </div>
                <Button variant="outline" className="mt-4" onClick={handleSaveHardware}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Hardware
                </Button>
            </div>
          </div>
        </div>

         <div className="absolute bottom-4 left-4 opacity-50">
            <Link href="/">
                <Button variant="ghost" size="icon" className="h-40 w-40">
                    <Home className="h-32 w-32 text-foreground" />
                </Button>
            </Link>
        </div>
        <div className="absolute bottom-4 right-4 opacity-50">
            <Link href="/log">
              <Button
                variant='ghost'
                size='icon'
                className="h-40 w-40"
              >
                <BookImage className="h-32 w-32 text-foreground" />
              </Button>
            </Link>
        </div>
      </main>
    </AppLayout>
  );
}
