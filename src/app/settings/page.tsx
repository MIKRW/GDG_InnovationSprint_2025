
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';


const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';

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


const NARRATION_TEXTS: { [key: number]: string } = {
    0: "/audio/narration-settings-intro.wav",
    1: "/audio/narration-settings-narration.wav",
    2: "/audio/narration-settings-theme.wav",
    3: "/audio/narration-settings-location.wav",
    4: "/audio/narration-settings-mode.wav",
    5: "/audio/narration-settings-hardware.wav",
};


export default function SettingsPage() {
  const { toast } = useToast();
  const [hardware, setHardware] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [narrationText, setNarrationText] = useState(NARRATION_TEXTS[0]);
  const { playNarration, isAutoPlayOn, toggleAutoPlay, ...speakerProps } = useSpeaker(narrationText, 'carousel');
  const [api, setApi] = useState<CarouselApi>();
  const [controlMode, setControlMode] = useState<'voice' | 'text'>('voice');
  
  const [debouncedNarration, cancelDebouncedNarration] = useDebouncedCallback((index: number) => {
    if (isAutoPlayOn) {
        const newNarration = NARRATION_TEXTS[index];
        if (newNarration) {
            setNarrationText(newNarration);
        }
    }
  }, 2000);

  useEffect(() => {
    setIsClient(true);
    const savedHardware = localStorage.getItem(HARDWARE_SETTINGS_KEY);
    if (savedHardware) {
      setHardware(savedHardware);
    }
  }, []);

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => {
        const selectedIndex = api.selectedScrollSnap();
        const newNarration = NARRATION_TEXTS[selectedIndex];
        if (newNarration) {
            if (isAutoPlayOn) {
                debouncedNarration(selectedIndex);
            } else {
                setNarrationText(newNarration);
            }
        }
    };

    api.on("select", handleSelect);
    
    return () => {
        api.off("select", handleSelect);
    };
  }, [api, isAutoPlayOn, debouncedNarration]);
  
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

  const ControlButton = ({ onToggle }: { onToggle: () => void }) => (
    <div className="flex justify-center mt-4">
        <Button
            onClick={onToggle}
            variant={controlMode === 'text' ? 'secondary' : 'default'}
            className="rounded-full px-8 py-4 text-lg font-semibold transition-colors duration-300"
        >
            {controlMode === 'voice' ? 'Voice Controlled' : 'Text Controlled'}
        </Button>
    </div>
  )

  const handleToggleControl = () => setControlMode(prev => prev === 'voice' ? 'text' : 'voice');

  return (
    <AppLayout>
      <main className="flex-1 flex flex-col items-center justify-center p-4 bg-muted overflow-hidden relative">
        <div className="absolute top-4 left-4 opacity-50">
            <SpeakerButton onClick={() => playNarration(narrationText)} {...speakerProps} />
        </div>
        <div className="absolute top-4 right-4 opacity-50">
            <ContrastButton />
        </div>

        <div className="flex flex-col items-center">
            <Carousel className="w-full max-w-xl" opts={{ loop: false }} setApi={setApi}>
                <CarouselContent className="h-[42rem]">
                    {/* Intro Card */}
                    <CarouselItem>
                       <div className="p-1 h-full">
                           <div className="bg-ring rounded-lg shadow-lg p-4 h-full flex flex-col">
                                <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg items-center justify-center">
                                    <CardHeader className="text-center">
                                        <Settings className="h-48 w-48 text-foreground mx-auto" />
                                        <CardTitle className="text-5xl font-mono pt-4">Settings</CardTitle>
                                        <CardDescription>Swipe to customize your app experience.</CardDescription>
                                    </CardHeader>
                                </Card>
                                <ControlButton onToggle={handleToggleControl} />
                            </div>
                        </div>
                    </CarouselItem>

                    {/* Auto-play Narration Card */}
                    <CarouselItem>
                        <div className="p-1 h-full">
                           <div className="bg-ring rounded-lg shadow-lg p-4 h-full flex flex-col">
                                <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg items-center justify-center text-center">
                                    <CardHeader>
                                        <ToggleLeft className="h-32 w-32 text-foreground mx-auto" />
                                        <CardTitle className="text-4xl font-mono pt-4">Auto-play Narration</CardTitle>
                                         <CardDescription>
                                            Automatically play descriptive audio for pages and slides.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center gap-6">
                                        <div className="flex items-center space-x-2">
                                            <Label htmlFor="autoplay-switch" className="text-lg">Auto-play Narration</Label>
                                            <Switch
                                                id="autoplay-switch"
                                                checked={isAutoPlayOn}
                                                onCheckedChange={toggleAutoPlay}
                                                className="h-8 w-16 [&>span]:h-6 [&>span]:w-6 [&>span[data-state=checked]]:translate-x-9"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                                <ControlButton onToggle={handleToggleControl} />
                            </div>
                        </div>
                    </CarouselItem>

                    {/* Theme Generator Card */}
                    <CarouselItem>
                        <div className="p-1 h-full">
                           <div className="bg-ring rounded-lg shadow-lg p-4 h-full flex flex-col">
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
                                <ControlButton onToggle={handleToggleControl} />
                            </div>
                        </div>
                    </CarouselItem>

                    {/* Location Settings Card */}
                     <CarouselItem>
                        <div className="p-1 h-full">
                           <div className="bg-ring rounded-lg shadow-lg p-4 h-full flex flex-col">
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
                                <ControlButton onToggle={handleToggleControl} />
                            </div>
                        </div>
                    </CarouselItem>

                    {/* App Mode Card */}
                    <CarouselItem>
                        <div className="p-1 h-full">
                           <div className="bg-ring rounded-lg shadow-lg p-4 h-full flex flex-col">
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
                                <ControlButton onToggle={handleToggleControl} />
                            </div>
                        </div>
                    </CarouselItem>

                     {/* Recording Hardware Card */}
                    <CarouselItem>
                        <div className="p-1 h-full">
                           <div className="bg-ring rounded-lg shadow-lg p-4 h-full flex flex-col">
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
                                <ControlButton onToggle={handleToggleControl} />
                            </div>
                        </div>
                    </CarouselItem>

                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </div>

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

    