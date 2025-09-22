
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AnalysisRun } from '@/lib/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { ResultDisplay } from '@/components/content/ResultDisplay';
import { notFound } from 'next/navigation';

interface ResultPageProps {
    params: {
        analysisRunId: string;
    };
    searchParams?: { [key: string]: string | string[] | undefined };
}

async function getAnalysisRun(id: string): Promise<AnalysisRun | null> {
    const docRef = doc(db, 'all_analysis_runs', id);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as AnalysisRun;
        } else {
            console.error("No analysis run found for ID:", id);
            return null;
        }
    } catch (e) {
        console.error("Error fetching analysis run:", e);
        return null;
    }
}

export default async function ResultPage({ params }: ResultPageProps) {
    const run = await getAnalysisRun(params.analysisRunId);

    if (!run) {
        notFound();
    }

    return (
        <AppLayout>
            <ResultDisplay run={run} />
        </AppLayout>
    );
}
