
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AnalysisRun } from '@/lib/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { ResultDisplay } from '@/components/content/ResultDisplay';
import { Button } from '@/components/ui/button';
import { BookImage, Check, Home, Loader2, Speaker, X } from 'lucide-react';
import Link from 'next/link';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';
import { useToast } from '@/hooks/use-toast';
import { useSpeaker } from '@/hooks/use-speaker';
import { notFound } from 'next/navigation';
import { useRouter } from 'next/navigation';

function ResultPageContent() {
    const searchParams = useSearchParams();
    const analysisRunId = searchParams.get('id');
    const [run, setRun] = useState<AnalysisRun | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    const narrationText = run 
        ? run.aiResult.isBirdSong 
            ? `Analysis complete. The AI identified this as a ${run.aiResult.commonName}. Review the details and save it to your Bird Book.`
            : `Analysis complete. The AI did not identify a bird in this recording.`
        : '';
    const { playNarration, ...speakerProps } = useSpeaker(narrationText, 'general');

    useEffect(() => {
        if (!analysisRunId) {
            setIsLoading(false);
            return;
        }

        const fetchRun = async () => {
            setIsLoading(true);
            const docRef = doc(db, 'all_analysis_runs', analysisRunId);
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRun({ id: docSnap.id, ...docSnap.data() } as AnalysisRun);
                } else {
                    console.error("No analysis run found for ID:", analysisRunId);
                    setRun(null);
                }
            } catch (e) {
                console.error("Error fetching analysis run:", e);
                setRun(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRun();
    }, [analysisRunId]);

    const handleSave = () => {
        if (!run) return;
        
        let savedRuns: AnalysisRun[] = [];
        try {
            const savedRunsJson = localStorage.getItem('saved-runs');
            if (savedRunsJson) {
                savedRuns = JSON.parse(savedRunsJson);
            }
        } catch (e) {
            console.error("Failed to parse saved runs from localStorage", e);
        }

        // Avoid duplicates
        if (!savedRuns.some(savedRun => savedRun.id === run.id)) {
            savedRuns.unshift(run); // Add to the beginning
            localStorage.setItem('saved-runs', JSON.stringify(savedRuns));
            toast({
                title: "Saved to Bird Book",
                description: `${run.aiResult.commonName || 'Your mystery recording'} has been saved.`,
            });
        } else {
             toast({
                title: "Already Saved",
                description: "This recording is already in your Bird Book.",
            });
        }
        
        router.push('/log');
    };

    const handleDiscard = () => {
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!run) {
        return notFound();
    }

    return (
        <AppLayout>
            <main className="flex-1 flex flex-col items-center justify-center p-4 bg-muted overflow-hidden relative">
                <div className="absolute top-4 left-4 opacity-50">
                    <SpeakerButton onClick={() => playNarration()} {...speakerProps} />
                </div>
                <div className="absolute top-4 right-4 opacity-50">
                    <ContrastButton />
                </div>

                <button
                    onClick={handleDiscard}
                    aria-label="Discard Result"
                    className="absolute left-4 sm:left-8 md:left-12 lg:left-24 top-1/2 -translate-y-1/2 h-32 w-32 fill-ring hover:scale-110 transition-transform"
                >
                    <X className="w-full h-full" strokeWidth={1} />
                </button>
                
                <div className="w-full max-w-xl h-[42rem]">
                    <ResultDisplay run={run} />
                </div>

                <button
                    onClick={handleSave}
                    aria-label="Save Result"
                    className="absolute right-4 sm:right-8 md:right-12 lg:right-24 top-1/2 -translate-y-1/2 h-32 w-32 fill-ring hover:scale-110 transition-transform"
                >
                    <Check className="w-full h-full" strokeWidth={1} />
                </button>
                
                <div className="absolute bottom-4 left-4 opacity-50">
                    <Link href="/log">
                        <Button variant="ghost" size="icon" className="h-28 w-28">
                            <BookImage className="h-20 w-20 text-foreground" />
                        </Button>
                    </Link>
                </div>
                <div className="absolute bottom-4 right-4 opacity-50">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="h-28 w-28">
                            <Home className="h-20 w-20 text-foreground" />
                        </Button>
                    </Link>
                </div>
            </main>
        </AppLayout>
    );
}


export default function ResultPage() {
    return (
        <Suspense fallback={<div className="flex flex-1 items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-muted-foreground" /></div>}>
            <ResultPageContent />
        </Suspense>
    );
}

