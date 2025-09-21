
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { RecordButton } from '@/components/content/RecordButton';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookImage, Settings, Home, ArrowLeft, ArrowRight } from 'lucide-react';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';

function AiAssistantCard() {
    const [isRecording, setIsRecording] = useState(false);

    const handleRecordingComplete = (blob: Blob) => {
        // Placeholder for AI assistant interaction
        console.log('AI assistant recording complete');
        setIsRecording(false);
    }

    return (
        <div className="bg-ring rounded-lg shadow-lg p-6 h-full">
            <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Bird Book Assistant</CardTitle>
                    <CardDescription className="text-lg italic">Your personal ornithologist</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center gap-4">
                     <div className="w-48 h-48">
                        <RecordButton
                            onStartRecording={() => setIsRecording(true)}
                            onRecordingComplete={handleRecordingComplete}
                            onStopRecording={() => setIsRecording(false)}
                            isRecording={isRecording}
                        />
                     </div>
                    <p className="text-muted-foreground text-center max-w-xs">
                        Press the button and ask me to find a bird by name, filter by date, or show you only your best recordings.
                    </p>
                </CardContent>
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
                    <CarouselPrevious size="icon" className="h-40 w-40 text-primary-foreground -left-60">
                        <ArrowLeft className="h-32 w-32" />
                    </CarouselPrevious>
                    <CarouselNext size="icon" className="h-40 w-40 text-primary-foreground -right-60">
                        <ArrowRight className="h-32 w-32" />
                    </CarouselNext>
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
