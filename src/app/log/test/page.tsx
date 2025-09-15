

'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { PageTitle } from '@/components/content/PageTitle';
import { Card, CardContent } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AnalysisRun, BirdSpeciesData } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface MasterTestRun extends AnalysisRun {
  actualBirdName?: string;
}

export default function MasterAudioTestLogPage() {
  const [testRuns, setTestRuns] = useState<MasterTestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    if (!isDevMode) return;

    const testRunCollectionRef = collection(db, 'all_analysis_runs');
    // Filter for tests that came from master audio files
    const q = query(testRunCollectionRef, where('isDeveloperData', '==', true), where('birdId', '!=', 'live-test'));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const runsPromises = querySnapshot.docs.map(async (runDoc) => {
            const runData = { id: runDoc.id, ...runDoc.data() } as AnalysisRun;
            let actualBirdName = runData.birdId; // Default to ID
            
            // Fetch the 'actual' bird's common name from the 'birds' collection
            if (runData.birdId) {
                const birdDocRef = doc(db, 'birds', runData.birdId);
                const birdDocSnap = await getDoc(birdDocRef);
                if (birdDocSnap.exists()) {
                    actualBirdName = (birdDocSnap.data() as BirdSpeciesData).commonName;
                }
            }

            return { ...runData, actualBirdName };
        });

        let runs = await Promise.all(runsPromises);
        
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
      <PageTitle>Master Audio Test History</PageTitle>
      <p className="text-muted-foreground mb-6">
        This log contains the results of running master audio files through the AI identifier.
      </p>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead>Bird Identified (AI)</TableHead>
                <TableHead>Actual Bird</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
                <TableHead className="text-right">Analysis Time</TableHead>
                <TableHead className="text-right">Prompt Ver.</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-5 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))}
               {!loading && testRuns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No master audio tests have been logged yet. Use the "Run Test Audio" tool on the Record page to begin.
                  </TableCell>
                </TableRow>
              )}
               {!loading && testRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    {run.aiResult.commonName === run.actualBirdName ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell>
                     <div className="font-medium">{run.aiResult.commonName || "No Bird Identified"}</div>
                     <div className="text-sm text-muted-foreground italic">{run.aiResult.scientificName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{run.actualBirdName}</div>
                  </TableCell>
                  <TableCell>{new Date(run.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{run.aiResult.confidence ? `${(run.aiResult.confidence * 100).toFixed(0)}%` : 'N/A'}</TableCell>
                  <TableCell className="text-right">{run.analysisTimings?.primaryIdentificationMs ? `${run.analysisTimings.primaryIdentificationMs}ms` : 'N/A'}</TableCell>
                  <TableCell className="text-right">{run.analysisMethod.split('-v').pop()}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/record/confirm/${run.id}`} asChild>
                        <Button variant="outline" size="sm">
                            <span>View</span>
                        </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
