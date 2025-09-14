

'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

import type { AnalysisRun, BirdLog } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';

import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ConfirmIdentificationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const analysisRunId = Array.isArray(params.analysisRunId) ? params.analysisRunId[0] : params.analysisRunId;
  const { user, loading: authLoading } = useAuth();
  const [analysisRun, setAnalysisRun] = useState<AnalysisRun | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userFeedback, setUserFeedback] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }

    const analysisRunDocRef = doc(db, 'all_analysis_runs', analysisRunId);
    
    const unsubscribe = onSnapshot(analysisRunDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AnalysisRun;
        // Ensure this analysis run belongs to the current user.
        if (data.userId === user.uid) {
            setAnalysisRun({ id: docSnap.id, ...data });
        } else {
            console.warn("User attempted to access an analysis run that does not belong to them.");
            setAnalysisRun(null); // Access denied
        }
      } else {
        setAnalysisRun(null); // Not found
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching analysis run:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [analysisRunId, user, authLoading]);

  const handleConfirmation = async (wasCorrect: boolean) => {
    if (!analysisRun || !user) return;

    setIsSubmitting(true);
    setUserFeedback(wasCorrect ? 'correct' : 'incorrect');
    const analysisRunRef = doc(db, 'all_analysis_runs', analysisRunId);


    if (wasCorrect) {
        // AI was correct. Create the log and update the analysis run.
        try {
            await updateDoc(analysisRunRef, { 
                userFeedback: {
                    aiWasCorrect: true,
                    timestamp: new Date().toISOString()
                },
                wasSavedByUser: true
            });

            // Create the final user-facing log
            const logId = uuidv4();
            const logDocRef = doc(db, 'users', user.uid, 'identifications', logId);
            const aiResult = analysisRun.aiResult;

            const finalLog: Omit<BirdLog, 'id'> = {
                sessionId: analysisRun.sessionId,
                analysisRunId: analysisRun.id,
                userId: user.uid,
                timestamp: analysisRun.timestamp,
                commonName: aiResult.commonName || 'Unknown',
                scientificName: aiResult.scientificName || 'Unknown',
                family: aiResult.family,
                order: aiResult.order,
                description: aiResult.description || '',
                imagePrompt: aiResult.imagePrompt || 'bird',
                audioUrl: analysisRun.inputAudioUrl,
                isMystery: false,
                status: 'active',
                latitude: analysisRun.locationData?.latitude,
                longitude: analysisRun.locationData?.longitude,
                locationDescription: analysisRun.locationData?.locationDescription,
                weather: aiResult.weather,
                season: aiResult.season,
                mode: analysisRun.mode,
            };

            await setDoc(logDocRef, finalLog);

            toast({
                title: 'Log Saved!',
                description: `${aiResult.commonName} has been added to your Bird Book.`,
            });
            router.push(`/log/${logId}`);

        } catch (error) {
            console.error('Failed to finalize log:', error);
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Could not save the log. Please try again.',
            });
            setIsSubmitting(false);
        }
    } else {
        // AI was incorrect. For now, we will just record this and save as a mystery log.
        // In the future, this is where we would show a search input to find the correct bird.
        try {
            await updateDoc(analysisRunRef, { 
                userFeedback: {
                    aiWasCorrect: false,
                    timestamp: new Date().toISOString()
                },
                 wasSavedByUser: false // User is not saving this as the AI suggested
            });

            toast({
                title: 'Feedback Recorded',
                description: "Thank you! We've noted the AI was incorrect.",
            });

            // For now, redirect to the main log page. A future step could involve a correction UI.
            router.push('/log');

        } catch(error) {
             console.error('Failed to record feedback:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not record your feedback. Please try again.',
            });
             setIsSubmitting(false);
        }
    }
  };

  const renderLoading = () => (
     <AppLayout header={<SecondaryHeader title="Confirming..." />}>
        <main className="flex-1 p-4">
          <Skeleton className="w-full h-64" />
          <Skeleton className="w-1/2 h-8 mt-4" />
          <Skeleton className="w-1/3 h-6 mt-2" />
          <Skeleton className="w-full h-24 mt-4" />
        </main>
      </AppLayout>
  );

  if (loading || authLoading || analysisRun === undefined) {
    return renderLoading();
  }

  if (analysisRun === null) {
    notFound();
  }

  const { aiResult } = analysisRun;

  if (!aiResult.isBirdSong || !aiResult.commonName) {
     // If the AI didn't find a bird, this page shouldn't have been loaded.
     // The RecordButton now handles this by showing a "save as mystery" dialog.
     // We'll redirect to the log page as a fallback.
     router.replace('/log');
     return renderLoading();
  }

  return (
    <AppLayout header={<SecondaryHeader title="Confirm Identification" />}>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex justify-center">
        <div className="w-full max-w-2xl">
            <Card>
              <CardHeader>
                <div className="aspect-square relative w-full rounded-md overflow-hidden bg-muted">
                   <Image
                      src={`https://picsum.photos/seed/${analysisRun.id}/600/400`}
                      alt={aiResult.commonName}
                      fill
                      className="object-cover"
                      data-ai-hint={aiResult.imagePrompt}
                    />
                </div>
                 <CardTitle className="pt-4 text-3xl">{aiResult.commonName}</CardTitle>
                 <p className="text-lg text-muted-foreground italic">{aiResult.scientificName}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base">{aiResult.description}</p>
                 <Alert>
                    <AlertTitle className="text-xl">Is this identification correct?</AlertTitle>
                    <AlertDescription>
                        Your feedback helps improve the AI. If the AI is wrong, you'll have a chance to correct it.
                    </AlertDescription>
                 </Alert>
              </CardContent>
              <CardFooter className="flex-col sm:flex-row gap-4 border-t pt-6">
                <Button 
                    variant="outline"
                    size="lg" 
                    className="w-full"
                    onClick={() => handleConfirmation(false)}
                    disabled={isSubmitting}
                >
                    {isSubmitting && userFeedback === 'incorrect' ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <ThumbsDown className="mr-2 h-5 w-5" />
                    )}
                    No, that's not it
                </Button>
                <Button 
                    size="lg" 
                    className="w-full"
                    onClick={() => handleConfirmation(true)}
                    disabled={isSubmitting}
                >
                     {isSubmitting && userFeedback === 'correct' ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <ThumbsUp className="mr-2 h-5 w-5" />
                    )}
                    Yes, that's the one!
                </Button>
              </CardFooter>
            </Card>
        </div>
      </main>
    </AppLayout>
  );
}

    