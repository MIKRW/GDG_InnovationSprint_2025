
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Carousel, CarouselApi, CarouselContent, CarouselItem, useCarousel } from '@/components/ui/carousel';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookImage, Settings, Home, Bot, Mic } from 'lucide-react';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';
import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
}

function AiAssistantCard({ isChatActive, onToggleChat }: { isChatActive: boolean, onToggleChat: () => void }) {
    return (
        <div className="bg-ring rounded-lg shadow-lg p-6 h-full">
            <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg">
                <CardContent className="flex-1 flex flex-col items-center justify-center gap-4">
                     <>
                        <div className="w-96 h-96">
                            <Button variant="ghost" className={cn("w-full h-full rounded-full hover:bg-background", isChatActive && "animate-pulse bg-background")} onClick={onToggleChat}>
                                <Bot className="h-96 w-96 text-foreground" />
                            </Button>
                        </div>
                        <div className="text-center">
                            <h2 className="text-8xl font-mono font-bold">Bird Book</h2>
                            <p className="text-3xl font-mono text-foreground/80">
                                {isChatActive ? "Listening..." : "Click the icon to give a command"}
                            </p>
                        </div>
                    </>
                </CardContent>
            </Card>
        </div>
    )
}

function BirdResultCard({ seed, onStartChat }: { seed: string, onStartChat: () => void }) {
    return (
        <div className="bg-ring rounded-lg shadow-lg p-6 h-full">
            <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg">
                <div className="relative w-full flex-1 pt-4">
                    <Image
                        src={`https://picsum.photos/seed/${seed}/600/400`}
                        alt="A picture of a bird"
                        fill
                        className="object-contain rounded-t-lg"
                        data-ai-hint="bird nature"
                    />
                </div>
                <div className="flex flex-col flex-1">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-mono">Sparrow</CardTitle>
                        <CardDescription className="text-lg italic font-mono">Passer domesticus</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <p className="text-muted-foreground">
                            A small, common bird found in most parts of the world. Sparrows are known for their cheerful chirping and social nature.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button variant="ghost" size="icon" onClick={onStartChat} className="h-20 w-20">
                            <Bot className="h-12 w-12" />
                        </Button>
                    </CardFooter>
                </div>
            </Card>
        </div>
    );
}

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { scrollPrev, canScrollPrev } = useCarousel();

  return (
    <button
      ref={ref}
      className={cn("absolute top-1/2 -translate-y-1/2 h-40 w-40 -left-60", className)}
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
      className={cn("absolute top-1/2 -translate-y-1/2 h-40 w-40 -right-60", className)}
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

export default function BirdBookPage() {
    const [api, setApi] = useState<CarouselApi>();
    const [isChatActive, setIsChatActive] = useState(false);

    useEffect(() => {
        if (!api) return;
        
        const onSelect = () => {
            // Deactivate chat if we scroll away from the assistant card
            if (api.selectedScrollSnap() !== 0) {
                setIsChatActive(false);
            }
        };

        api.on("select", onSelect);
        return () => {
            api.off("select", onSelect);
        };
    }, [api]);
    
    const startChat = () => {
        api?.scrollTo(0);
        setIsChatActive(true);
    };

    const handleToggleChat = () => {
        // If chat is active anywhere, this button will deactivate it.
        // If chat is inactive and we are on the main card, it will activate it.
        if (isChatActive) {
            setIsChatActive(false);
        } else if (api?.selectedScrollSnap() === 0) {
            setIsChatActive(true);
        }
    };


    return (
        <AppLayout>
            <main className="flex-1 flex flex-col items-center justify-center p-4 bg-muted overflow-hidden relative">
                <div className="absolute top-4 left-4 opacity-50">
                    <SpeakerButton />
                </div>
                <div className="absolute top-4 right-4 opacity-50">
                    <ContrastButton />
                </div>

                <Carousel className="w-full max-w-3xl" opts={{ loop: false }} setApi={setApi}>
                    <CarouselContent>
                        <CarouselItem>
                            <div className="p-1 h-[60rem]">
                                <AiAssistantCard isChatActive={isChatActive} onToggleChat={handleToggleChat} />
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="p-1 h-[60rem]">
                               <BirdResultCard seed="bird1" onStartChat={startChat} />
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="p-1 h-[60rem]">
                                <BirdResultCard seed="bird2" onStartChat={startChat} />
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="p-1 h-[60rem]">
                               <BirdResultCard seed="bird3" onStartChat={startChat} />
                            </div>
                        </CarouselItem>
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>

                <div className="absolute bottom-4 left-4 opacity-50">
                    <Link href="/log">
                        <Button variant="ghost" size="icon" className="h-40 w-40">
                            <BookImage className="h-32 w-32 text-foreground" />
                        </Button>
                    </Link>
                </div>
                <div className="absolute bottom-4 right-4 opacity-50">
                    <Link href="/">
                      <Button
                        variant='ghost'
                        size='icon'
                        className="h-40 w-40"
                      >
                        <Home className="h-32 w-32 text-foreground" />
                      </Button>
                    </Link>
                </div>
            </main>
        </AppLayout>
    );
}
