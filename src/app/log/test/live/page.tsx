
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
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

export default function LiveTestLogPage() {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    if (!isDevMode) return;

    const testRunCollectionRef = collection(db, 'all_test_runs');
    // Filter for tests that came from live recordings in dev mode
    const q = query(testRunCollectionRef, where('source', '==', 'live_recording'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const runs: TestRun[] = [];
        querySnapshot.forEach((doc) => {
            runs.push({ id: doc.id, ...doc.data() } as TestRun);
        });
        // Sort client-side to avoid needing a composite index in Firestore
        runs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setTestRuns(runs);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [isDevMode]);


  if (!isDevMode) {
    return (
        <div className="flex-1 p-4 text-center">
            <p>This page is not available.</p>
        </div>
    )
  }

  return (
    <>
      <PageTitle>Live Recording Test History</PageTitle>
      <p className="text-muted-foreground mb-6">
        This log contains results from using the main Record button in developer mode.
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
                  <p className="text-muted-foreground">No live tests have been logged yet. Use the main Record button to capture audio and create a test run.</p>
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
                              {run.ai-hint={log.imagePrompt}
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
    </>
  );
}
