
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
import { AlertTriangle } from 'lucide-react';

function ResultPageContent() {
    const searchParams = useSearchParams();
    const analysisRunId = searchParams.get('id');
    const [run, setRun] = useState<AnalysisRun | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                    setRun(docSnap.data() as AnalysisRun);
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

    if (loading) {
        return (
            <div className="w-full max-w-xl h-[42rem] p-1">
                <div className="bg-ring rounded-lg shadow-lg p-6 h-full relative">
                    <Skeleton className="w-full h-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!run) {
        return null;
    }

    return <ResultDisplay run={run} />;
}

export default function ResultPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResultPageContent />
        </Suspense>
    );
}
