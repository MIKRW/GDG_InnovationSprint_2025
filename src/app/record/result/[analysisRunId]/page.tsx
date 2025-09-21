
'use client';

import { useEffect, useState, useRef } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AnalysisRun } from '@/lib/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BookImage, Download, Home, PlayCircle, Settings, ThumbsDown, ThumbsUp } from 'lucide-react';
import { generateBirdImage } from '@/ai/flows/instructional-generate-bird-image-flow';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';
import Link from 'next/link';

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
        return <Skeleton className="w-full h-96" />;
    }

    if (!imageUrl) {
        return (
            <div className="w-full h-96 bg-muted flex items-center justify-center text-muted-foreground">
                <AlertTriangle className="w-8 h-8" />
                <p className="ml-2">Image could not be loaded.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-96">
            <Image
                src={imageUrl}
                alt={prompt}
                fill
                className="object-cover rounded-t-lg"
            />
        </div>
    );
}

function ResultPageContent({ run }: { run: AnalysisRun }) {
    const [feedbackGiven, setFeedbackGiven] = useState(false);
    const { toast } = useToast();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio();
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
        toast({
            title: "Coming Soon!",
            description: "Downloading results will be available in a future update.",
        });
    }

    const { isBirdSong, commonName, scientificName, description, imagePrompt, error } = run.aiResult;

    const NotIdentifiedCard = () => (
        <Card className="w-full max-w-2xl shadow-2xl">
            <CardHeader className="text-center">
                <CardTitle className="text-4xl">Not Identified</CardTitle>
                <CardDescription className="text-xl italic">No bird was identified in the recording.</CardDescription>
            </CardHeader>
            <CardContent>
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
                    <Button variant="outline" onClick={handleReplay} className="w-full">
                        <PlayCircle className="mr-2 h-4 w-4" /> Replay Audio
                    </Button>
                )}
            </CardFooter>
        </Card>
    );

    return (
        <>
            {isBirdSong === false || error ? <NotIdentifiedCard /> : (
                <Card className="w-full max-w-2xl shadow-2xl">
                    {imagePrompt && <BirdImage prompt={imagePrompt} />}
                    <CardHeader className="text-center">
                        <CardTitle className="text-4xl">{commonName}</CardTitle>
                        <CardDescription className="text-xl italic">{scientificName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-center">{description}</p>
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
                </Card>
            )}
        </>
    );
}


export default function ResultPage({ params }: { params: { analysisRunId: string } }) {
    const [run, setRun] = useState<AnalysisRun | null>(null);
    const [loading, setLoading] = useState(true);
    const [analysisRunId, setAnalysisRunId] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        const unwrapParams = async () => {
            try {
                const resolvedParams = await params;
                setAnalysisRunId(resolvedParams.analysisRunId);
            } catch (e) {
                console.error("Failed to resolve params", e);
                setLoading(false);
            }
        };
        unwrapParams();
    }, [params, isClient]);

    useEffect(() => {
        if (!analysisRunId) return;

        const fetchRun = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, 'all_analysis_runs', analysisRunId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setRun({ id: docSnap.id, ...docSnap.data() } as AnalysisRun);
                } else {
                    setRun(null);
                }
            } catch (error) {
                console.error("Error fetching analysis run:", error);
                setRun(null);
            } finally {
                setLoading(false);
            }
        };
        fetchRun();
    }, [analysisRunId]);

    if (!isClient) return null;

    if (loading) {
        return (
            <AppLayout>
                <main className="flex-1 flex flex-col items-center justify-center bg-muted p-4 relative">
                    <Skeleton className="h-[40rem] w-full max-w-2xl" />
                </main>
            </AppLayout>
        );
    }

    if (!run) {
        return notFound();
    }

    return (
        <AppLayout>
            <main className="flex-1 flex flex-col items-center justify-center bg-muted p-4 relative">
                <div className="absolute top-4 left-4 opacity-50">
                    <SpeakerButton />
                </div>
                <div className="absolute top-4 right-4 opacity-50">
                    <ContrastButton />
                </div>
                
                <ResultPageContent run={run} />

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
