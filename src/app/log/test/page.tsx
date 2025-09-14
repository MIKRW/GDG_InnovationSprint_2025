
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { PageTitle } from '@/components/content/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface TestRun {
    id: string;
    timestamp: string;
    promptVersion: string;
    aiResult: {
        isBirdSong: boolean;
        commonName?: string;
        scientificName?: string;
        description?: string;
    }
}

export default function MasterAudioTestLogPage() {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    if (!isDevMode) return;

    const testRunCollectionRef = collection(db, 'all_test_runs');
    // Filter for tests that came from master audio files
    const q = query(testRunCollectionRef, where('source', '==', 'master_audio'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const runs: TestRun[] = [];
        querySnapshot.forEach((doc) => {
            runs.push({ id: doc.id, ...doc.data() } as TestRun);
        });
        setTestRuns(runs);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [isDevMode]);


  if (!isDevMode) {
    return (
        <AppLayout header={<SecondaryHeader title="Not Found" />}>
            <main className="flex-1 p-4 text-center">
                <p>This page is not available.</p>
            </main>
            <SecondaryPageFooterV2 />
        </AppLayout>
    )
  }

  return (
    <AppLayout header={<SecondaryHeader title="Master Audio Test Results" />}>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <PageTitle>Master Audio Test History</PageTitle>
        <p className="text-muted-foreground mb-6">
          This log contains the results of running master audio files through the AI identifier.
        </p>
        <div className="space-y-4">
            {loading && (
                <>
                    <Skeleton className="w-full h-32" />
                    <Skeleton className="w-full h-32" />
                </>
            )}
            {!loading && testRuns.length === 0 && (
                <Card className="p-4">
                    <p className="text-muted-foreground">No master audio tests have been logged yet. Use the "Run Test Audio" tool on the Record page to begin.</p>
                </Card>
            )}
            {testRuns.map((run) => (
                <Card key={run.id}>
                    <CardHeader>
                        <CardTitle className="text-xl flex justify-between items-center">
                            <span>
                                {run.aiResult.isBirdSong ? run.aiResult.commonName : "No Bird Identified"}
                            </span>
                             <Badge variant={run.aiResult.isBirdSong ? 'default' : 'destructive'}>
                                {run.aiResult.isBirdSong ? "Success" : "Failure"}
                            </Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {new Date(run.timestamp).toLocaleString()} &bull; Prompt v{run.promptVersion}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <p className="italic text-muted-foreground">
                            {run.aiResult.scientificName || "N/A"}
                        </p>
                         <p className="mt-2 text-sm">
                            {run.aiResult.description || "The AI could not identify a bird in the audio."}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
