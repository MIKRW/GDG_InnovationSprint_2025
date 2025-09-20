

'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { kebabCase } from 'lodash';

import type { AnalysisRun, BirdSpeciesData } from '@/lib/types';
import { db } from '@/lib/firebase';

import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Loader2, Bird } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateBirdImage } from '@/ai/flows/instructional-generate-bird-image-flow';
import { saveCanonicalImage } from '@/lib/actions';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';


type PageState = 'loading' | 'showingResult';

export default function IdentificationResultPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const analysisRunId = Array.isArray(params.analysisRunId) ? params.analysisRunId[0] : params.analysisRunId;
  
  const [pageState, setPageState] = useState<PageState>('loading');
  const [analysisRun, setAnalysisRun] = useState<AnalysisRun | null>(null);
  const [generatedImageDataUri, setGeneratedImageDataUri] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Effect to load the analysis run data
  useEffect(() => {
    const fetchAnalysisRun = async () => {
      // The analysis run might be in either collection if it's a dev test
      const collectionsToTry = ['all_analysis_runs', 'all_test_runs'];
      let foundRun: AnalysisRun | null = null;
      
      for (const collectionName of collectionsToTry) {
        const docRef = doc(db, collectionName, analysisRunId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          foundRun = { id: docSnap.id, ...docSnap.data() } as AnalysisRun;
          break;
        }
      }
      
      if(foundRun) {
        setAnalysisRun(foundRun);
        setPageState('showingResult');
        // If the analysis was successful and gave an image prompt, generate the image
        if(foundRun.aiResult?.isBirdSong && foundRun.aiResult.imagePrompt) {
            findOrCreateBirdImage(foundRun);
        }
      } else {
        setAnalysisRun(null); // This will trigger the notFound() call
      }
    };

    fetchAnalysisRun().catch(error => {
      console.error("Error fetching analysis run:", error);
      setAnalysisRun(null);
    });

  }, [analysisRunId]);


  const findOrCreateBirdImage = async (run: AnalysisRun) => {
    if (!run.aiResult.commonName) return;

    setIsImageLoading(true);
    const birdId = kebabCase(run.aiResult.commonName);
    const birdDocRef = doc(db, 'birds', birdId);

    try {
        const birdDocSnap = await getDoc(birdDocRef);

        if (birdDocSnap.exists() && birdDocSnap.data().canonicalImageUrls?.key) {
            setGeneratedImageDataUri(birdDocSnap.data().canonicalImageUrls.key);
        } else {
            const { imageDataUri } = await generateBirdImage({ prompt: run.aiResult.imagePrompt! });
            setGeneratedImageDataUri(imageDataUri);
            
            // In the background, save this new image as the canonical one
            // We don't wait for this to finish to show the user the result
            saveCanonicalImage(
                run.aiResult.commonName,
                run.aiResult.scientificName || 'N/A',
                imageDataUri,
                'key'
            ).catch(err => console.error("Failed to save canonical image in background:", err));
        }
    } catch (error) {
        console.error("Image generation/fetching failed:", error);
        toast({ variant: 'destructive', title: 'Image Failed', description: 'Could not load an image for this bird.' });
    } finally {
        setIsImageLoading(false);
    }
  };


  const renderLoading = () => (
     <AppLayout header={<SecondaryHeader title="Analyzing..." />}>
        <main className="flex-1 p-4 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
        </main>
      </AppLayout>
  );

  const renderContent = () => {
    if (!analysisRun) return notFound();

    const { aiResult, inputAudioUrl } = analysisRun;
    const { commonName, scientificName, description } = aiResult;
    const title = commonName || "Not Identified";

    return (
      <AppLayout header={<SecondaryHeader title={title} />}>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 flex justify-center">
          <div className="w-full max-w-2xl">
            <Card>
                <CardHeader>
                    <div className="aspect-square relative w-full rounded-md overflow-hidden bg-muted">
                        {isImageLoading ? (
                             <div className="flex flex-col items-center justify-center h-full">
                               <Loader2 className="w-12 h-12 animate-spin" />
                               <p className="mt-4">Generating image...</p>
                           </div>
                        ) : generatedImageDataUri ? (
                            <Image
                                src={generatedImageDataUri}
                                alt={commonName || 'Bird image'}
                                fill
                                className="object-cover"
                                unoptimized={generatedImageDataUri.includes('firebasestorage')}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-secondary">
                                <Bird className="w-24 h-24 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <CardTitle className="pt-4 text-3xl">{title}</CardTitle>
                    {scientificName && <p className="text-lg text-muted-foreground italic">{scientificName}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-base">{description || "The AI could not identify a bird song in this recording."}</p>
                    {inputAudioUrl && (
                      <div className="pt-4">
                        <h3 className="font-semibold mb-2">Your Recording</h3>
                        <audio controls src={inputAudioUrl} className="w-full">
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={() => router.push('/record')}>
                        Make a New Recording
                    </Button>
                </CardFooter>
            </Card>
          </div>
        </main>
        <SecondaryPageFooter />
      </AppLayout>
    );
  }

  return pageState === 'loading' ? renderLoading() : renderContent();
}
