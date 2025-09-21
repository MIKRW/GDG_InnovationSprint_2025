
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, useCarousel } from '@/components/ui/carousel';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookImage, Settings, Home, Bot } from 'lucide-react';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';
import React from 'react';
import { cn } from '@/lib/utils';

function AiAssistantCard() {
    return (
        <div className="bg-ring rounded-lg shadow-lg p-6 h-full">
            <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg">
                <CardContent className="flex-1 flex flex-col items-center justify-center gap-4">
                     <div className="w-96 h-96">
                        <Button variant="ghost" className="w-full h-full rounded-full">
                            <Bot className="h-96 w-96 text-foreground" />
                        </Button>
                     </div>
                </CardContent>
                <CardHeader className="text-center">
                    <CardTitle className="text-8xl font-mono font-bold">Bird Book</CardTitle>
                    <CardDescription className="text-3xl font-mono text-foreground/80">
                        swipe to see your birds or click to chat to the guide to organize your bird book
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
}

function BirdResultCard({ seed }: { seed: string }) {
    return (
        <div className="bg-ring rounded-lg shadow-lg p-6 h-full">
            <Card className="w-full h-full shadow-2xl rounded-lg">
                <div className="relative w-full h-64">
                    <Image
                        src={`https://picsum.photos/seed/${seed}/600/400`}
                        alt="A picture of a bird"
                        fill
                        className="object-cover rounded-lg"
                        data-ai-hint="bird nature"
                    />
                </div>
                <CardHeader>
                    <CardTitle className="text-3xl">Sparrow</CardTitle>
                    <CardDescription className="text-lg italic">Passer domesticus</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        A small, common bird found in most parts of the world. Sparrows are known for their cheerful chirping and social nature.
                    </p>
                </CardContent>
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
    return (
        <AppLayout>
            <main className="flex-1 flex flex-col items-center justify-center p-4 bg-muted overflow-hidden relative">
                <div className="absolute top-4 left-4 opacity-50">
                    <SpeakerButton />
                </div>
                <div className="absolute top-4 right-4 opacity-50">
                    <ContrastButton />
                </div>

                <Carousel className="w-full max-w-3xl" opts={{ loop: true }}>
                    <CarouselContent>
                        <CarouselItem>
                            <div className="p-1 h-[60rem]">
                                <AiAssistantCard />
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="p-1 h-[60rem]">
                               <BirdResultCard seed="bird1" />
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="p-1 h-[60rem]">
                                <BirdResultCard seed="bird2" />
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="p-1 h-[60rem]">
                               <BirdResultCard seed="bird3" />
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
