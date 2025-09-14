

'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

import type { BirdLog, AnalysisRun } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';

import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Bird, Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trashLog } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

export default function LogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, loading: authLoading } = useAuth();
  const [log, setLog] = useState<BirdLog | null | undefined>(undefined);
  const [analysisRun, setAnalysisRun] = useState<AnalysisRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return; // Wait for authentication to resolve
    }
    if (!user) {
      console.warn("Log detail page cannot fetch data: No user authenticated.");
      setLoading(false);
      // Optionally redirect or show a 'not logged in' message
      return;
    }

    const logDocRef = doc(db, 'users', user.uid, 'identifications', id);
    
    const unsubscribe = onSnapshot(logDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as BirdLog;
        if (data.status === 'trashed') {
            setLog(null); // Treat trashed logs as not found in this view
        } else {
            const logData = { id: docSnap.id, ...data };
            setLog(logData);
            // Fetch associated analysis run
            if(logData.analysisRunId) {
                const analysisRunRef = doc(db, 'all_analysis_runs', logData.analysisRunId);
                const analysisRunSnap = await getDoc(analysisRunRef);
                if (analysisRunSnap.exists()) {
                    setAnalysisRun(analysisRunSnap.data() as AnalysisRun);
                }
            }
        }
      } else {
        setLog(null); // Not found
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching log detail:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user, authLoading]);

  const handleDelete = async () => {
    if (!log || !user) return;
    setIsDeleting(true);

    try {
      await trashLog(log);
      toast({
        title: 'Log Moved to Trash',
        description: 'The log entry has been moved to your trash.',
      });
      router.push('/log');
    } catch (error) {
      console.error('Failed to move log to trash:', error);
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: 'Could not move the log to trash. Please try again.',
      });
      setIsDeleting(false);
    }
  };


  if (loading || authLoading || log === undefined) {
    return (
      <AppLayout header={<SecondaryHeader title="Loading..." />}>
        <main className="flex-1 p-4">
          <Skeleton className="w-full h-64" />
          <Skeleton className="w-1/2 h-8 mt-4" />
          <Skeleton className="w-1/3 h-6 mt-2" />
          <Skeleton className="w-full h-24 mt-4" />
        </main>
        <SecondaryPageFooterV2 />
      </AppLayout>
    );
  }

  if (log === null) {
    notFound();
  }

  return (
    <AppLayout header={<SecondaryHeader title={log.commonName} />}>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex justify-center">
        <div className="w-full max-w-2xl">
            <Card>
              <CardHeader>
                <div className="aspect-square relative w-full rounded-md overflow-hidden bg-muted">
                    {log.imageUrl ? (
                        <Image
                            src={log.imageUrl}
                            alt={log.commonName}
                            fill
                            className="object-cover"
                            unoptimized // Important for Firebase Storage URLs
                        />
                    ) : (
                         <div className="w-full h-full flex items-center justify-center bg-secondary">
                            <Bird className="w-24 h-24 text-muted-foreground" />
                        </div>
                    )}
                </div>
                 <CardTitle className="pt-4 text-3xl">{log.commonName}</CardTitle>
                 <p className="text-lg text-muted-foreground italic">{log.scientificName}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base">{log.description}</p>
                {log.audioUrl && (
                  <div>
                    <h3 className="font-semibold mb-2">Saved Recording</h3>
                    <audio controls src={log.audioUrl} className="w-full">
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Captured: {new Date(log.timestamp).toLocaleString()}</Badge>
                     {log.isMystery && <Badge variant="destructive">Unidentified</Badge>}
                      {log.order && (
                        <Badge variant="outline">
                            Order: {log.order}
                        </Badge>
                      )}
                      {log.family && (
                        <Badge variant="outline">
                            Family: {log.family}
                        </Badge>
                      )}
                     {log.latitude && log.longitude && (
                       <Badge variant="outline">
                         {`Location: ${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}`}
                       </Badge>
                     )}
                      {log.locationDescription && (
                        <Badge variant="outline">
                            {`Location: ${log.locationDescription}`}
                        </Badge>
                      )}
                      {log.weather && (
                        <Badge variant="outline">
                          {log.weather}
                        </Badge>
                      )}
                      {log.season && (
                        <Badge variant="outline">
                          {log.season}
                        </Badge>
                      )}
                      {analysisRun?.appAIVersion && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                             {analysisRun.appAIVersion}
                          </Badge>
                      )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting || !user}>
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Move to Trash
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will move the log to your trash. You will be able to restore it later from the Settings page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
        </div>
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
