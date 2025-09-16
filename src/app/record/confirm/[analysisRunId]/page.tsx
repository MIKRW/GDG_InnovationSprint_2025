

'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, setDoc, addDoc, collection, onSnapshot, getDocs, query, where } from 'firebase/firestore';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { kebabCase } from 'lodash';

import type { AnalysisRun, BirdLog, BirdSpeciesData } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';

import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateBirdImage } from '@/ai/flows/generate-bird-image-flow';
import { saveCanonicalImage } from '@/lib/actions';


type PageState = 'loading' | 'confirmingId' | 'confirmingImage' | 'saving' | 'done';

const PROMPT_VERSION = "1.8"; // Added confidence score to AI output

export default function ConfirmIdentificationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const analysisRunId = Array.isArray(params.analysisRunId) ? params.analysisRunId[0] : params.analysisRunId;
  const { user, loading: authLoading } = useAuth();
  
  const [pageState, setPageState] = useState<PageState>('loading');
  const [analysisRun, setAnalysisRun] = useState<AnalysisRun | null>(undefined);
  const [birdSpeciesData, setBirdSpeciesData] = useState<BirdSpeciesData | null>(null);
  const [generatedImageDataUri, setGeneratedImageDataUri] = useState<string | null>(null);


  // Effect to load the initial analysis run data from either collection
  useEffect(() => {
    if (authLoading || !user) {
      setPageState('loading');
      return;
    }

    const fetchAnalysisRun = async () => {
      const collectionsToTry = ['all_analysis_runs', 'all_test_runs'];
      let foundRun: AnalysisRun | null = null;
      
      for (const collectionName of collectionsToTry) {
        const docRef = doc(db, collectionName, analysisRunId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          foundRun = { id: docSnap.id, ...docSnap.data() } as AnalysisRun;
          break;
        }
      }
      
      setAnalysisRun(foundRun);
      setPageState(foundRun ? 'confirmingId' : 'loading');
    };

    fetchAnalysisRun().catch(error => {
      console.error("Error fetching analysis run:", error);
      setPageState('loading');
    });

  }, [analysisRunId, user, authLoading]);


  const handleIdConfirmation = async (wasCorrect: boolean) => {
    if (!analysisRun) return;

    setPageState('saving');

    const collectionName = analysisRun.isDeveloperData ? 'all_test_runs' : 'all_analysis_runs';
    const analysisRunRef = doc(db, collectionName, analysisRunId);
    
    await updateDoc(analysisRunRef, { 
        'userFeedback.aiWasCorrect': wasCorrect,
        'userFeedback.timestamp': new Date().toISOString()
    });
    
    if (analysisRun.isDeveloperData) {
        toast({ title: 'Test Feedback Recorded' });
        const redirectPath = analysisRun.birdId === 'live-test' ? '/log/test/live' : '/log/test';
        router.push(redirectPath);
        return;
    }
    
    if (!wasCorrect) {
        // User said AI was wrong, no image needed. Just give thanks.
        toast({ title: "Feedback Recorded", description: "Thank you for helping improve the AI!" });
        router.push('/log');
        return;
    }

    // AI was correct, move to image confirmation phase
    await findOrCreateBirdImage();
  };

  const findOrCreateBirdImage = async () => {
    if (!analysisRun?.aiResult.commonName) return;

    setPageState('confirmingImage');
    const birdId = kebabCase(analysisRun.aiResult.commonName);
    const birdDocRef = doc(db, 'birds', birdId);
    const birdDocSnap = await getDoc(birdDocRef);

    if (birdDocSnap.exists() && birdDocSnap.data().canonicalImageUrls?.key) {
        // Found an existing canonical image
        setBirdSpeciesData(birdDocSnap.data() as BirdSpeciesData);
        setGeneratedImageDataUri(birdDocSnap.data().canonicalImageUrls.key);
    } else {
        // No image exists, generate one
        await handleGenerateImage();
    }
  };

  const handleGenerateImage = async () => {
     if (!analysisRun?.aiResult.imagePrompt) return;
     setGeneratedImageDataUri(null); // Clear old image while generating new one

     try {
        const { imageDataUri } = await generateBirdImage({ prompt: analysisRun.aiResult.imagePrompt });
        setGeneratedImageDataUri(imageDataUri);
     } catch (error) {
        console.error("Image generation failed:", error);
        toast({ variant: 'destructive', title: 'Image Generation Failed' });
        // Allow user to proceed without an image for now
        setGeneratedImageDataUri('error');
     }
  };

  const handleImageApproval = async () => {
    if (!analysisRun || !user || !generatedImageDataUri || !analysisRun.aiResult.commonName) return;

    setPageState('saving');

    let finalImageUrl = generatedImageDataUri;

    // If this is a newly generated image (not a URL), save it and get the URL
    if (generatedImageDataUri.startsWith('data:image')) {
        finalImageUrl = await saveCanonicalImage(
            analysisRun.aiResult.commonName,
            analysisRun.aiResult.scientificName || 'N/A',
            generatedImageDataUri,
            'key' // For now, we only handle the 'key' image
        );
    }
    
    // Now create the final user log
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
        imageUrl: finalImageUrl,
        imagePrompt: aiResult.imagePrompt || '',
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
    
    const collectionName = analysisRun.isDeveloperData ? 'all_test_runs' : 'all_analysis_runs';
    await updateDoc(doc(db, collectionName, analysisRun.id), { wasSavedByUser: true });
    
    toast({ title: 'Log Saved!', description: `${aiResult.commonName} has been added to your Bird Book.` });
    router.push(`/log/${logId}`);
  };


  const renderLoading = () => (
     <AppLayout header={<SecondaryHeader title="Confirming..." />}>
        <main className="flex-1 p-4 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
        </main>
      </AppLayout>
  );

  const renderContent = () => {
    if (!analysisRun) return notFound();

    const { aiResult } = analysisRun;

    if (pageState === 'confirmingId') {
        const title = aiResult.isBirdSong ? "Is this identification correct?" : "The AI found no bird song. Is that correct?";
        const description = aiResult.isBirdSong ? "Your feedback helps improve the AI. If the AI is wrong, you'll have a chance to correct it." : "If you believe there was a bird in the recording, please mark this as incorrect. Your feedback is valuable.";

        return (
            <>
                {aiResult.isBirdSong && (
                    <CardHeader>
                        <div className="aspect-square relative w-full rounded-md overflow-hidden bg-muted">
                            <Skeleton className="w-full h-full" />
                        </div>
                        <CardTitle className="pt-4 text-3xl">{aiResult.commonName}</CardTitle>
                        <p className="text-lg text-muted-foreground italic">{aiResult.scientificName}</p>
                    </CardHeader>
                )}
                 <CardContent className="space-y-4">
                    {aiResult.isBirdSong && <p className="text-base">{aiResult.description}</p>}
                    <Alert>
                        <AlertTitle className="text-xl">{title}</AlertTitle>
                        <AlertDescription>{description}</AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter className="flex-col sm:flex-row gap-4 border-t pt-6">
                    <Button variant="outline" size="lg" className="w-full" onClick={() => handleIdConfirmation(false)}>
                        <ThumbsDown className="mr-2 h-5 w-5" /> No, that's not it
                    </Button>
                    <Button size="lg" className="w-full" onClick={() => handleIdConfirmation(true)}>
                        <ThumbsUp className="mr-2 h-5 w-5" /> Yes, that's correct
                    </Button>
                </CardFooter>
            </>
        )
    }

     if (pageState === 'confirmingImage') {
        return (
            <>
                <CardHeader>
                    <div className="aspect-square relative w-full rounded-md overflow-hidden bg-muted">
                       {generatedImageDataUri === 'error' ? (
                           <div className="flex flex-col items-center justify-center h-full text-destructive">
                               <p>Image generation failed.</p>
                           </div>
                       ) : generatedImageDataUri ? (
                            <Image
                                src={generatedImageDataUri}
                                alt={aiResult.commonName || 'Generated image of bird'}
                                fill
                                className="object-cover"
                                unoptimized={generatedImageDataUri.includes('firebasestorage')}
                            />
                       ) : (
                           <div className="flex flex-col items-center justify-center h-full">
                               <Loader2 className="w-12 h-12 animate-spin" />
                               <p className="mt-4">Generating image...</p>
                           </div>
                       )}
                    </div>
                    <CardTitle className="pt-4 text-3xl">{aiResult.commonName}</CardTitle>
                </CardHeader>
                 <CardContent>
                    <Alert>
                        <AlertTitle className="text-xl">Approve this image?</AlertTitle>
                        <AlertDescription>
                            This image will be saved to your log and will become the default image for this species.
                        </AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter className="flex-col sm:flex-row gap-4 border-t pt-6">
                    <Button variant="outline" size="lg" className="w-full" onClick={handleGenerateImage} disabled={!generatedImageDataUri}>
                         <RefreshCw className="mr-2 h-5 w-5" /> Regenerate
                    </Button>
                    <Button size="lg" className="w-full" onClick={handleImageApproval} disabled={!generatedImageDataUri || generatedImageDataUri === 'error'}>
                        <CheckCircle2 className="mr-2 h-5 w-5" /> Approve and Save Log
                    </Button>
                </CardFooter>
            </>
        )
    }

     if (pageState === 'saving') {
        return (
            <CardContent className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Saving to your log...</p>
            </CardContent>
        );
    }
  }


  if (pageState === 'loading' || !analysisRun) {
    return renderLoading();
  }

  return (
    <AppLayout header={<SecondaryHeader title="Confirm Identification" />}>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex justify-center">
        <div className="w-full max-w-2xl">
            <Card>
                {renderContent()}
            </Card>
        </div>
      </main>
    </AppLayout>
  );
}

    