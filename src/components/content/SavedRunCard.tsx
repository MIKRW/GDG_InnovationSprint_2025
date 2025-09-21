
'use client';

import { useState, useEffect, useRef } from 'react';
import type { AnalysisRun } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Bot, Download, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import { generateBirdImage } from '@/ai/flows/instructional-generate-bird-image-flow';
import { useToast } from '@/hooks/use-toast';


function BirdImage({ commonName }: { commonName: string }) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!commonName) return;

        const generate = async () => {
            setIsLoading(true);
            try {
                const result = await generateBirdImage({ commonName });
                setImageUrl(result.imageDataUri);
            } catch (error) {
                console.error("Failed to generate bird image:", error);
            } finally {
                setIsLoading(false);
            }
        };

        generate();
    }, [commonName]);

    if (isLoading) {
        return <Skeleton className="w-full h-full" />;
    }

    if (!imageUrl) {
        return (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                <AlertTriangle className="w-8 h-8" />
                <p className="ml-2">Image could not be loaded.</p>
            </div>
        );
    }

    return (
        <Image
            src={imageUrl}
            alt={`A generated image of a ${commonName}`}
            fill
            className="object-contain rounded-t-lg"
            data-ai-hint="bird nature"
        />
    );
}

export function SavedRunCard({ run, onStartChat }: { run: AnalysisRun, onStartChat: () => void }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();
    const { isBirdSong, commonName, scientificName, description, error } = run.aiResult;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio();
        }
    }, []);

    const handleReplay = () => {
        if (run?.inputAudioUrl && audioRef.current) {
            audioRef.current.src = run.inputAudioUrl;
            audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        }
    };
    
    const handleDownload = () => {
        if (run?.inputAudioUrl) {
            window.open(run.inputAudioUrl, '_blank');
        } else {
            toast({
                variant: 'destructive',
                title: "Not Available",
                description: "The audio URL is not available for download.",
            });
        }
    };

    return (
        <div className="bg-ring rounded-lg shadow-lg p-4 h-full">
            <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg">
                {isBirdSong === false || !commonName ? (
                    <>
                        <CardHeader className="text-center pt-12">
                            <CardTitle className="text-4xl font-mono">Mystery Recording</CardTitle>
                             <CardDescription className="text-xl italic font-mono">
                                {new Date(run.creationTime).toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-1 items-center justify-center text-muted-foreground">
                           <p className="text-center">{description || "The AI could not identify a bird song in this recording."}</p>
                        </CardContent>
                    </>
                ) : (
                     <>
                        <div className="relative w-full flex-1 pt-4">
                            <BirdImage commonName={commonName} />
                        </div>
                        <div className="flex flex-col flex-1">
                            <CardHeader className="text-center">
                                <CardTitle className="text-3xl font-mono">{commonName}</CardTitle>
                                <CardDescription className="text-lg italic font-mono">{scientificName}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-muted-foreground text-center">
                                    {description}
                                </p>
                            </CardContent>
                        </div>
                    </>
                )}
                 <CardFooter className="flex flex-col gap-4">
                     <div className="flex w-full justify-around">
                        <Button variant="outline" onClick={handleReplay} disabled={!run.inputAudioUrl}>
                            <PlayCircle className="mr-2 h-4 w-4" /> Replay Audio
                        </Button>
                        <Button variant="outline" onClick={handleDownload} disabled={!run.inputAudioUrl}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                    </div>
                     <div className="flex w-full justify-center items-center pt-4 border-t">
                        <Button variant="ghost" size="icon" onClick={onStartChat} className="h-24 w-24">
                            <Bot className="h-20 w-20" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
    