
'use client';

import { useEffect, useState, useRef } from 'react';
import type { AnalysisRun } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Download, PlayCircle, ThumbsDown, ThumbsUp } from 'lucide-react';
import { generateBirdImage } from '@/ai/flows/instructional-generate-bird-image-flow';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';


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

interface ResultDisplayProps {
    run: AnalysisRun;
}

export function ResultDisplay({ run }: ResultDisplayProps) {
    const [feedbackGiven, setFeedbackGiven] = useState(false);
    const { toast } = useToast();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { isBirdSong, commonName, scientificName, description, error } = run.aiResult;
    
    useEffect(() => {
        // Initialize Audio object only on the client side
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio();
        }
    }, []);

    const handleFeedback = async (wasCorrect: boolean) => {
        if (!run) return;
        
        const docRef = doc(db, 'all_analysis_runs', run.id);

        try {
            await updateDoc(docRef, {
                userFeedback: {
                    aiWasCorrect: wasCorrect,
                    timestamp: new Date().toISOString(),
                }
            });
            setFeedbackGiven(true);
            toast({
                title: "Feedback Submitted",
                description: "Thank you for helping improve the AI!",
            });
        } catch (error) {
            console.error("Failed to submit feedback:", error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Could not submit feedback.",
            });
        }
    };
    
    const handleReplay = () => {
        if (run?.inputAudioUrl && audioRef.current) {
            audioRef.current.src = run.inputAudioUrl;
            audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        }
    }
    
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
    }

    const NotIdentifiedCard = () => (
        <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg">
            <CardHeader className="text-center pt-12">
                <CardTitle className="text-4xl font-mono">Not Identified</CardTitle>
                <CardDescription className="text-xl italic font-mono">No bird was identified in the recording.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 items-center justify-center">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>AI Analysis Result</AlertTitle>
                    <AlertDescription>
                        {description || error || "The AI could not confidently identify a bird song in the audio provided."}
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                {run.inputAudioUrl && (
                     <div className="flex w-full justify-around">
                        <Button variant="outline" onClick={handleReplay}>
                            <PlayCircle className="mr-2 h-4 w-4" /> Replay Audio
                        </Button>
                        <Button variant="outline" onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );

    return (
        <>
            {isBirdSong === false || error ? <NotIdentifiedCard /> : (
                <Card className="w-full h-full shadow-2xl flex flex-col rounded-lg">
                    <div className="relative w-full flex-1 pt-4">
                        {commonName && <BirdImage commonName={commonName} />}
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
                        <CardFooter className="flex flex-col gap-4">
                            <div className="flex w-full justify-around">
                                {run.inputAudioUrl && (
                                    <Button variant="outline" onClick={handleReplay}>
                                        <PlayCircle className="mr-2 h-4 w-4" /> Replay Audio
                                    </Button>
                                )}
                                <Button variant="outline" onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" /> Download
                                </Button>
                            </div>
                            <div className="flex w-full flex-col items-center gap-2 pt-4 border-t">
                                <p className="text-sm text-muted-foreground">Was this identification correct?</p>
                                <div className="flex gap-4">
                                    <Button variant="outline" size="sm" onClick={() => handleFeedback(true)} disabled={feedbackGiven}>
                                        <ThumbsUp className="mr-2 h-4 w-4" /> Correct
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleFeedback(false)} disabled={feedbackGiven}>
                                        <ThumbsDown className="mr-2 h-4 w-4" /> Incorrect
                                    </Button>
                                </div>
                            </div>
                        </CardFooter>
                    </div>
                </Card>
            )}
        </>
    );
}
