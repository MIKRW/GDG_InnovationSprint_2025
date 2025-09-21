
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { RecordButton } from '@/components/content/RecordButton';
import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { logErrorToFirestore } from '@/lib/error-logging';
import { identifyBirdBySound, type IdentifyBirdOutput } from '@/ai/flows/contextual-identify-bird-flow';
import { createAnalysisRun } from '@/lib/actions';
import type { LocationSettings } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ColorableLogo } from '@/components/content/ColorableLogo';
import { BookImage, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';
import { useToast } from '@/hooks/use-toast';

const LOCATION_SETTINGS_KEY = 'location-settings';
const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';
const ANALYSIS_TIMEOUT_MS = 90000; // 90 seconds


export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const currentSessionId = useRef<string | null>(null);
  const currentCreationTime = useRef<string | null>(null);

  const getLocationForAIShot = (
    callback: (locationData?: { latitude?: number; longitude?: number, locationDescription?: string }) => void
  ) => {
    if (!isClient) {
      callback();
      return;
    }
    const savedSettingsJson = localStorage.getItem(LOCATION_SETTINGS_KEY);
    let settings: LocationSettings = { mode: 'device', manual: { latitude: 0, longitude: 0 }, description: '', privacy: { isOutside: true } };
    if (savedSettingsJson) {
      try { 
        const parsed = JSON.parse(savedSettingsJson);
        if (parsed) {
          settings = parsed;
        }
      } catch { /* Fallback to default */ }
    }

    if (settings.mode === 'device') {
      navigator.geolocation.getCurrentPosition(
        (position) => callback({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => callback() // Proceed without location on error/denial
      );
    } else if (settings.mode === 'manual') {
      callback(settings.manual);
    } else if (settings.mode === 'description') {
      callback({ locationDescription: settings.description });
    } else { // privacy mode
      callback();
    }
  };
  
  const processAudio = async (audioDataUri: string, recordingId: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      getLocationForAIShot(async (locationData) => {
          if (!currentCreationTime.current || !currentSessionId.current) {
              return reject(new Error("Missing session or timestamp for analysis."));
          }
          
          const hardware = localStorage.getItem(HARDWARE_SETTINGS_KEY);
          let result: IdentifyBirdOutput | null = null;
          let analysisRunId: string | null = null;
          
          try {
              const analysisStartTime = Date.now();
              result = await identifyBirdBySound({
                  audioDataUri: audioDataUri,
                  creationTime: currentCreationTime.current!,
                  ...locationData,
                  mode: 'newbie' // Hardcoded for now
              });
              const analysisDurationMs = Date.now() - analysisStartTime;
              const wasSuccessful = result && result.isBirdSong && !!result.commonName;

              analysisRunId = await createAnalysisRun(
                  audioDataUri, recordingId, result, wasSuccessful, locationData, hardware, 'newbie',
                  { primaryIdentificationMs: analysisDurationMs },
                  currentSessionId.current, currentCreationTime.current
              );
              resolve(analysisRunId);

          } catch (error) {
              const analysisDurationMs = Date.now() - (currentCreationTime.current ? new Date(currentCreationTime.current).getTime() : Date.now());
              result = { error: (error as Error).message, isBirdSong: false };
              logErrorToFirestore(error as Error, 'ai-identification-failure', {
                  sessionId: currentSessionId.current, creationTime: currentCreationTime.current,
                  locationData: locationData, userId: 'anonymous'
              });
              
              analysisRunId = await createAnalysisRun(
                  audioDataUri, recordingId, result, false,
                  locationData, hardware, 'newbie',
                  { primaryIdentificationMs: analysisDurationMs },
                  currentSessionId.current, currentCreationTime.current
              );
              // In case of error, we still resolve with the ID to navigate to the error page
              resolve(analysisRunId);
          }
      });
    });
  };

  const handleStart = () => {
    setIsRecording(true);
    currentSessionId.current = uuidv4();
    currentCreationTime.current = new Date().toISOString();
  }

  const handleRecordingComplete = async (audioBlob: Blob) => {
    const recordingId = uuidv4();
    let analysisRunId: string | null = null;

    try {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const audioDataUri = reader.result as string;

            try {
                const timeoutPromise = new Promise<null>((_, reject) => 
                    setTimeout(() => reject(new Error('Analysis timed out')), ANALYSIS_TIMEOUT_MS)
                );

                analysisRunId = await Promise.race([
                    processAudio(audioDataUri, recordingId),
                    timeoutPromise
                ]);

            } catch (error) {
                console.error("Failed to process live recording:", error);
                logErrorToFirestore(error as Error, 'live-audio-processing-failure', {
                    userId: 'anonymous',
                    recordingId,
                });
                if ((error as Error).message === 'Analysis timed out') {
                    toast({
                        variant: 'destructive',
                        title: 'Analysis Timed Out',
                        description: `The analysis took too long to complete. Please try again.`,
                    });
                }
            } finally {
                setIsProcessing(false);
                if (analysisRunId) {
                    router.push(`/record/result/${analysisRunId}`);
                }
            }
        };
        reader.onerror = (error) => {
            throw new Error("Failed to read audio blob: " + error);
        };
    } catch (error) {
        setIsProcessing(false);
        logErrorToFirestore(error as Error, 'audio-blob-conversion-failure', { userId: 'anonymous' });
        toast({ variant: 'destructive', title: 'Error', description: 'Could not process recorded audio.' });
    }
  }
  
  const handleStop = () => {
    setIsRecording(false);
    setIsProcessing(true);
  }


  return (
    <AppLayout>
      <main className="flex flex-1 flex-col items-center justify-center bg-muted p-4 relative">
        <div className="absolute top-4 left-4 opacity-50">
            <SpeakerButton />
        </div>
        <div className="absolute top-4 right-4 opacity-50">
            <ContrastButton />
        </div>
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center gap-0 pb-16 w-[60rem] h-[40rem]">
             <div className="w-[40rem] h-[40rem] p-12">
                <ColorableLogo className="w-full h-full animate-color-cycle" />
             </div>
            <div className="pl-4">
                <p className="text-8xl font-mono font-bold text-foreground text-center -mt-16 animate-color-cycle">Analyzing...</p>
            </div>
          </div>
        ) : (
          <div className="w-[60rem] h-[40rem] flex items-center justify-center">
            <RecordButton
                onStart={handleStart}
                onStop={handleStop}
                onRecordingComplete={handleRecordingComplete}
                isRecording={isRecording}
            />
          </div>
        )}
        <div className="absolute bottom-4 left-4 opacity-50">
            <Link href="/log">
                <Button variant="ghost" size="icon" className="h-40 w-40">
                    <BookImage className="h-32 w-32 text-foreground" />
                </Button>
            </Link>
        </div>
        <div className="absolute bottom-4 right-4 opacity-50">
            <Link href="/settings">
              <Button
                variant='ghost'
                size='icon'
                className="h-40 w-40"
              >
                <Settings className="h-32 w-32 text-foreground" />
              </Button>
            </Link>
        </div>
      </main>
    </AppLayout>
  );
}
