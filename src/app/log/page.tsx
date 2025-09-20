
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PrimaryHeader } from '@/components/layout/PrimaryHeader';
import { HomePageFooter } from '@/components/layout/HomePageFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { RecordButton } from '@/components/content/RecordButton';
import { useState } from 'react';

function AiAssistantCard() {
    const [isRecording, setIsRecording] = useState(false);

    const handleRecordingComplete = (blob: Blob) => {
        // Placeholder for AI assistant interaction
        console.log('AI assistant recording complete');
        setIsRecording(false);
    }

    return (
         <Card className="w-full h-[60rem] shadow-2xl flex flex-col">
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
    )
}

function BirdResultCard({ seed }: { seed: string }) {
    return (
        <Card className="w-full h-[60rem] shadow-2xl">
            <div className="relative w-full h-64">
                <Image
                    src={`https://picsum.photos/seed/${seed}/600/400`}
                    alt="A picture of a bird"
                    fill
                    className="object-cover rounded-t-lg"
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
    );
}

export default function BirdBookPage() {
    return (
        <AppLayout header={<PrimaryHeader />}>
            <main className="flex-1 flex flex-col items-center justify-center p-4 bg-muted overflow-hidden">
                <Carousel className="w-full max-w-2xl" opts={{ loop: true }}>
                    <CarouselContent>
                        <CarouselItem>
                            <div className="p-1">
                                <AiAssistantCard />
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="p-1">
                               <BirdResultCard seed="bird1" />
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="p-1">
                                <BirdResultCard seed="bird2" />
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="p-1">
                               <BirdResultCard seed="bird3" />
                            </div>
                        </CarouselItem>
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </main>
            <HomePageFooter centerButtonLabel="Home Page" centerButtonHref="/" />
        </AppLayout>
    );
}
