
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, where, getDoc, doc } from 'firebase/firestore';
import { PageTitle } from '@/components/content/PageTitle';
import { Card, CardContent } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AnalysisRun, BirdSpeciesData } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { notFound } from 'next/navigation';
import { useIsLiveSite } from '@/hooks/useIsLiveSite';

interface MasterTestRun extends AnalysisRun {
  actualBirdName?: string;
}

function MasterAudioTestLog() {
  const [testRuns, setTestRuns] = useState<MasterTestRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testRunCollectionRef = collection(db, 'all_test_runs');
    const q = query(testRunCollectionRef, where('birdId', '!=', 'live-test'));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const runsPromises = querySnapshot.docs.map(async (runDoc) => {
            const runData = { id: runDoc.id, ...runDoc.data() } as AnalysisRun;
            let actualBirdName = runData.birdId;

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
        runs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setTestRuns(runs);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
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
                <TableCell className="text-right">{run.analysisMethod ? run.analysisMethod.split('-v').pop() : 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/record/confirm/${run.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function LiveRecordingTestLog() {
    const [testRuns, setTestRuns] = useState<AnalysisRun[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const testRunCollectionRef = collection(db, 'all_test_runs');
        const q = query(testRunCollectionRef, where('birdId', '==', 'live-test'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const runs: AnalysisRun[] = [];
            querySnapshot.forEach((doc) => {
                runs.push({ id: doc.id, ...doc.data() } as AnalysisRun);
            });
            runs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setTestRuns(runs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">User Feedback</TableHead>
                            <TableHead>Bird Identified (AI)</TableHead>
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
                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                            </TableRow>
                        ))}
                        {!loading && testRuns.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No live tests have been logged yet. Use the main Record button in dev mode to create a test run.
                                </TableCell>
                            </TableRow>
                        )}
                        {!loading && testRuns.map((run) => (
                            <TableRow key={run.id}>
                                <TableCell>
                                    {run.userFeedback?.aiWasCorrect === true && <CheckCircle className="h-5 w-5 text-green-500" />}
                                    {run.userFeedback?.aiWasCorrect === false && <XCircle className="h-5 w-5 text-destructive" />}
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{run.aiResult.commonName || "No Bird Identified"}</div>
                                    <div className="text-sm text-muted-foreground italic">{run.aiResult.scientificName}</div>
                                </TableCell>
                                <TableCell>{new Date(run.timestamp).toLocaleString()}</TableCell>
                                <TableCell className="text-right">{run.aiResult.confidence ? `${(run.aiResult.confidence * 100).toFixed(0)}%` : 'N/A'}</TableCell>
                                <TableCell className="text-right">{run.analysisTimings?.primaryIdentificationMs ? `${run.analysisTimings.primaryIdentificationMs}ms` : 'N/A'}</TableCell>
                                <TableCell className="text-right">{run.analysisMethod ? run.analysisMethod.split('-v').pop() : 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/record/confirm/${run.id}`}>
                                        <Button variant="outline" size="sm">
                                            View
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export default function MasterAudioTestLogPage() {
  const isLiveSite = useIsLiveSite();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (isClient && isLiveSite) {
    notFound();
  }

  if (!isClient) {
    return null; // Or a loading skeleton
  }

  return (
    <>
      <PageTitle>AI Test History</PageTitle>
      <p className="text-muted-foreground mb-6">
        This log contains the results of running tests through the AI identifier in developer mode.
      </p>
      <Tabs defaultValue="master-audio">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="master-audio">Master Audio Tests</TabsTrigger>
          <TabsTrigger value="live-recordings">Live Recording Tests</TabsTrigger>
        </TabsList>
        <TabsContent value="master-audio" className="mt-4">
          <MasterAudioTestLog />
        </TabsContent>
        <TabsContent value="live-recordings" className="mt-4">
          <LiveRecordingTestLog />
        </TabsContent>
      </Tabs>
    </>
  );
}
