
'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AnalysisRun } from '@/lib/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Download, Home, PlayCircle, ThumbsDown, ThumbsUp } from 'lucide-react';
import { generateBirdImage } from '@/ai/flows/instructional-generate-bird-image-flow';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

function BirdImage({ prompt }: { prompt: string }) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!prompt) return;

        const generate = async () => {
            setIsLoading(true);
            try {
                const result = await generateBirdImage({ prompt });
                setImageUrl(result.imageDataUri);
            } catch (error) {
                console.error("Failed to generate bird image:", error);
            } finally {
                setIsLoading(false);
            }
        };

        generate();
    }, [prompt]);

    if (isLoading) {
        return <Skeleton className="w-full h-64" />;
    }

    if (!imageUrl) {
        return (
            <div className="w-full h-64 bg-muted flex items-center justify-center text-muted-foreground">
                <AlertTriangle className="w-8 h-8" />
                <p className="ml-2">Image could not be loaded.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-64">
            <Image
                src={imageUrl}
                alt={prompt}
                fill
                className="object-cover rounded-t-lg"
            />
        </div>
    );
}


export default function ResultPage({ params }: { params: { analysisRunId: string } }) {
    const [run, setRun] = useState<AnalysisRun | null>(null);
    const [loading, setLoading] = useState(true);
    const [feedbackGiven, setFeedbackGiven] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const audioRef = useState(new Audio());

    useEffect(() => {
        const fetchRun = async () => {
            if (!params.analysisRunId) return;
            setLoading(true);
            const docRef = doc(db, 'all_analysis_runs', params.analysisRunId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setRun(docSnap.data() as AnalysisRun);
            } else {
                notFound();
            }
            setLoading(false);
        };
        fetchRun();
    }, [params.analysisRunId]);
    
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
        if (run?.inputAudioUrl) {
            const [audio] = audioRef;
            audio.src = run.inputAudioUrl;
            audio.play().catch(e => console.error("Error playing audio:", e));
        }
    }
    
    const handleDownload = () => {
        // This is a placeholder for future functionality
        toast({
            title: "Coming Soon!",
            description: "Downloading results will be available in a future update.",
        });
    }

    if (loading) {
        return (
            <AppLayout header={<SecondaryHeader title="Analyzing..." />}>
                <main className="flex-1 flex items-center justify-center p-4 bg-muted">
                    <Skeleton className="h-96 w-full max-w-lg" />
                </main>
            </AppLayout>
        );
    }

    if (!run) {
        return notFound();
    }

    const { isBirdSong, commonName, scientificName, description, imagePrompt } = run.aiResult;

    const NotIdentifiedCard = () => (
        <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
                <CardTitle className="text-3xl">Not Identified</CardTitle>
                <CardDescription className="text-lg italic">No bird was identified in the recording.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>AI Analysis Result</AlertTitle>
                    <AlertDescription>
                        {description || "The AI could not confidently identify a bird song in the audio provided."}
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <div className="flex w-full justify-around">
                    <Button variant="outline" onClick={handleReplay}>
                        <PlayCircle className="mr-2 h-4 w-4" /> Replay Audio
                    </Button>
                </div>
                <Button className="w-full mt-4" onClick={() => router.push('/')}>
                    <Home className="mr-2 h-4 w-4" /> New Recording
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <AppLayout header={<SecondaryHeader title="Analysis Result" />}>
            <main className="flex-1 flex items-center justify-center p-4 bg-muted">
                {isBirdSong === false ? <NotIdentifiedCard /> : (
                    <Card className="w-full max-w-lg shadow-2xl">
                        {imagePrompt && <BirdImage prompt={imagePrompt} />}
                        <CardHeader>
                            <CardTitle className="text-3xl">{commonName}</CardTitle>
                            <CardDescription className="text-lg italic">{scientificName}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{description}</p>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <div className="flex w-full justify-around">
                                <Button variant="outline" onClick={handleReplay}>
                                    <PlayCircle className="mr-2 h-4 w-4" /> Replay Audio
                                </Button>
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
                            <Button className="w-full mt-4" onClick={() => router.push('/')}>
                               <Home className="mr-2 h-4 w-4" /> New Recording
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </main>
        </AppLayout>
    );
}
