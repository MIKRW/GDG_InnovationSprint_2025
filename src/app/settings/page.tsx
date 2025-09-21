
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BookImage, Home, Save, Settings, Palette, MapPin, AudioLines, ToggleLeft } from 'lucide-react';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';
import { useSpeaker } from '@/hooks/use-speaker';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselApi, CarouselContent, CarouselItem, useCarousel } from '@/components/ui/carousel';
import React from 'react';
import { cn } from '@/lib/utils';


const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';
const PAGE_NARRATION = "This is the Settings page. Swipe left and right to customize the application's look and feel, manage location services, and set your preferred recording hardware.";

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { scrollPrev, canScrollPrev } = useCarousel();

  return (
    <button
      ref={ref}
      className={cn("absolute top-1/2 -translate-y-1/2 h-32 w-32 -left-40", className)}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      aria-label="Previous slide"
    >
        <svg viewBox="0 0 100 100" className="w-full h-full fill-ring">
            <path d="M 80,5 20,50 80,95 Z" />
        </svg>
    </button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { scrollNext, canScrollNext } = useCarousel();

  return (
    <button
      ref={ref}
      className={cn("absolute top-1/2 -translate-y-1/2 h-32 w-32 -right-40", className)}
      disabled={!canScrollNext}
      onClick={scrollNext}
      aria-label="Next slide"
    >
        <svg viewBox="0 0 100 100" className="w-full h-full fill-ring">
            <path d="M 20,5 80,50 20,95 Z" />
        </svg>
    </button>
  );
});
CarouselNext.displayName = "CarouselNext"


export default function SettingsPage() {
  const { toast } = useToast();
  const [hardware, setHardware] = useState('');
  const [isClient, setIsClient] = useState(false);
  const { playNarration, toggleAutoPlay, isAutoPlayOn, ...speakerProps } = useSpeaker(PAGE_NARRATION);
  const [api, setApi] = useState<CarouselApi>();
  const [controlMode, setControlMode] = useState<'voice' | 'text'>('text');

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

  if (!isClient) {
    return null;
  }

  return (
    <AppLayout>
      <main className="flex-1 flex flex-col items-center justify-center p-4 bg-muted overflow-hidden relative">
        <div className="absolute top-4 left-4 opacity-50">
            <SpeakerButton onClick={playNarration} {...speakerProps} />
        </div>
        <div className="absolute top-4 right-4 opacity-50">
            <ContrastButton />
        </div>

        <Carousel className="w-full max-w-xl" opts={{ loop: false }} setApi={setApi}>
            <CarouselContent className="h-[42rem]">
                {/* Intro Card */}
                <CarouselItem>
                    <div className="p-1 h-full">
                       <div className="bg-ring rounded-lg shadow-lg p-4 h-full">
                            <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg items-center justify-center">
                                <CardHeader className="text-center">
                                    <Settings className="h-48 w-48 text-foreground mx-auto" />
                                    <CardTitle className="text-5xl font-mono pt-4">Settings</CardTitle>
                                    <CardDescription>Swipe to customize your app experience.</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>
                </CarouselItem>

                 {/* Control Mode Card */}
                <CarouselItem>
                    <div className="p-1 h-full">
                       <div className="bg-ring rounded-lg shadow-lg p-4 h-full">
                            <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg items-center justify-center">
                                <CardHeader className="text-center">
                                    <AudioLines className="h-48 w-48 text-foreground mx-auto" />
                                    <CardTitle className="text-4xl font-mono pt-4">Control Mode</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center gap-4">
                                     <CardDescription>
                                        Switch between voice and text input. (Voice coming soon)
                                    </CardDescription>
                                     <div className="flex justify-center mt-4">
                                        <Button
                                            onClick={() => setControlMode(controlMode === 'voice' ? 'text' : 'voice')}
                                            variant={controlMode === 'text' ? 'secondary' : 'default'}
                                            className="rounded-full px-8 py-4 text-lg font-semibold transition-colors duration-300"
                                        >
                                            {controlMode === 'voice' ? 'Voice Controlled' : 'Text Controlled'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CarouselItem>

                {/* Auto-play Narration Card */}
                <CarouselItem>
                    <div className="p-1 h-full">
                       <div className="bg-ring rounded-lg shadow-lg p-4 h-full">
                            <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg items-center justify-center">
                                <CardHeader className="text-center">
                                    <ToggleLeft className="h-48 w-48 text-foreground mx-auto" />
                                    <CardTitle className="text-4xl font-mono pt-4">Auto-play Narration</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center gap-4">
                                     <CardDescription>
                                        Automatically play descriptive audio on each page.
                                    </CardDescription>
                                    <div className="flex items-center space-x-2 pt-4">
                                        <Label htmlFor="auto-play-switch" className="text-lg">Off</Label>
                                        <Switch
                                            id="auto-play-switch"
                                            checked={isAutoPlayOn}
                                            onCheckedChange={toggleAutoPlay}
                                            className="h-8 w-16 [&>span]:h-6 [&>span]:w-6 [&>span[data-state=checked]]:translate-x-9"
                                        />
                                        <Label htmlFor="auto-play-switch" className="text-lg">On</Label>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CarouselItem>

                {/* Theme Generator Card */}
                <CarouselItem>
                    <div className="p-1 h-full">
                       <div className="bg-ring rounded-lg shadow-lg p-4 h-full">
                            <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg items-center justify-center">
                                <CardHeader className="text-center">
                                    <Palette className="h-48 w-48 text-foreground mx-auto" />
                                    <CardTitle className="text-4xl font-mono pt-4">Customize Theme</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild variant="outline" size="lg" className="text-lg">
                                      <Link href="/theme">Open Theme Editor</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CarouselItem>

                {/* Location Settings Card */}
                 <CarouselItem>
                    <div className="p-1 h-full">
                       <div className="bg-ring rounded-lg shadow-lg p-4 h-full">
                            <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg items-center justify-center">
                                <CardHeader className="text-center">
                                    <MapPin className="h-48 w-48 text-foreground mx-auto" />
                                    <CardTitle className="text-4xl font-mono pt-4">Location Settings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild variant="outline" size="lg" className="text-lg">
                                      <Link href="/settings/location">Manage Location</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CarouselItem>

                {/* App Mode Card */}
                <CarouselItem>
                    <div className="p-1 h-full">
                       <div className="bg-ring rounded-lg shadow-lg p-4 h-full">
                            <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg items-center justify-center">
                                <CardHeader className="text-center">
                                    <AudioLines className="h-48 w-48 text-foreground mx-auto" />
                                    <CardTitle className="text-4xl font-mono pt-4">App Mode</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild variant="outline" size="lg" className="text-lg">
                                      <Link href="/settings/mode">Change App Mode</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CarouselItem>

                 {/* Recording Hardware Card */}
                <CarouselItem>
                    <div className="p-1 h-full">
                       <div className="bg-ring rounded-lg shadow-lg p-4 h-full">
                            <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg items-center justify-center text-center">
                                <CardHeader>
                                    <CardTitle className="text-4xl font-mono">Recording Hardware</CardTitle>
                                    <CardDescription>
                                        Optionally, specify the microphone you use for recording.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="w-full max-w-sm space-y-4">
                                     <Input
                                        id="hardware-input"
                                        value={hardware}
                                        onChange={(e) => setHardware(e.target.value)}
                                        placeholder="e.g., iPhone 15 Pro, Rode NTG"
                                        className="text-center text-lg h-12"
                                    />
                                    <Button variant="outline" size="lg" className="mt-4 text-lg" onClick={handleSaveHardware}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Hardware
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CarouselItem>

            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>

        <div className="absolute bottom-4 left-4 opacity-50">
            <Link href="/log">
                <Button variant="ghost" size="icon" className="h-28 w-28">
                    <BookImage className="h-20 w-20 text-foreground" />
                </Button>
            </Link>
        </div>

        <div className="absolute bottom-4 right-4 opacity-50">
            <Link href="/">
              <Button
                variant='ghost'
                size='icon'
                className="h-28 w-28"
              >
                <Home className="h-20 w-20 text-foreground" />
              </Button>
            </Link>
        </div>
      </main>
    </AppLayout>
  );
}
