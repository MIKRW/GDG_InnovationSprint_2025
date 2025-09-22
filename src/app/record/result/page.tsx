
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AnalysisRun } from '@/lib/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { ResultDisplay } from '@/components/content/ResultDisplay';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BookImage, Check, Home, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSpeaker } from '@/hooks/use-speaker';
import { updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


const SAVED_RUNS_KEY = 'saved-runs';

function ResultPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const analysisRunId = searchParams.get('id');
    const [run, setRun] = useState<AnalysisRun | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const narrationText = run?.aiResult.isBirdSong ? `The AI has identified the bird as a ${run.aiResult.commonName}. ${run.aiResult.description}` : `The AI was not able to identify a bird in the recording. ${run?.aiResult.description || run?.aiResult.error}`;
    const { playNarration, ...speakerProps } = useSpeaker(narrationText);

    useEffect(() => {
        if (!analysisRunId) {
            setError("No analysis ID was provided.");
            setLoading(false);
            return;
        }

        const fetchRun = async () => {
            const docRef = doc(db, 'all_analysis_runs', analysisRunId);
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRun({ id: docSnap.id, ...docSnap.data() } as AnalysisRun);
                } else {
                    setError("Analysis run not found.");
                }
            } catch (e) {
                console.error("Error fetching analysis run:", e);
                setError("Failed to load analysis results.");
            } finally {
                setLoading(false);
            }
        };

        fetchRun();
    }, [analysisRunId]);

    const handleSave = async () => {
        if (!run) return;

        const savedRunsJson = localStorage.getItem(SAVED_RUNS_KEY);
        const savedRuns: AnalysisRun[] = savedRunsJson ? JSON.parse(savedRunsJson) : [];
        const newSavedRuns = [run, ...savedRuns];
        localStorage.setItem(SAVED_RUNS_KEY, JSON.stringify(newSavedRuns));

        const docRef = doc(db, 'all_analysis_runs', run.id);
        await updateDoc(docRef, { wasSavedByUser: true });
        
        toast({
            title: 'Saved to Bird Book',
            description: 'Your identification has been saved.',
        });

        router.push('/log');
    };

    return (
       <AppLayout>
            <main className="flex-1 flex flex-col items-center justify-center p-4 bg-muted overflow-hidden relative">
                 <div className="absolute top-4 left-4 opacity-50">
                    <SpeakerButton onClick={() => playNarration()} {...speakerProps} />
                </div>
                <div className="absolute top-4 right-4 opacity-50">
                    <ContrastButton />
                </div>
                
                <div className="w-full max-w-xl h-[42rem] relative">
                     <Link href="/">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1/2 -translate-y-1/2 h-32 w-32 -left-40 text-primary hover:text-primary"
                            aria-label="Discard analysis"
                        >
                            <X className="h-full w-full" />
                        </Button>
                    </Link>

                    <div className="p-1 h-full">
                         <div className="bg-ring rounded-lg shadow-lg p-6 h-full relative">
                            {loading && (
                                <Skeleton className="w-full h-full" />
                            )}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {!loading && !error && run && (
                                <ResultDisplay run={run} />
                            )}
                        </div>
                    </div>
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSave}
                        className="absolute top-1/2 -translate-y-1/2 h-32 w-32 -right-40 text-primary hover:text-primary"
                        aria-label="Save analysis"
                    >
                        <Check className="h-full w-full" />
                    </Button>
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


export default function ResultPage() {
    return (
        <Suspense fallback={<Skeleton className="w-full h-screen" />}>
            <ResultPageContent />
        </Suspense>
    );
}
