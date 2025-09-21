'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { RecordButton } from '@/components/content/RecordButton';
import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { logErrorToFirestore } from '@/lib/error-logging';
import { createAnalysisRun } from '@/lib/actions';
import type { LocationSettings } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ColorableLogo } from '@/components/content/ColorableLogo';
import { BookImage, Settings, AlertTriangle, MicOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { app, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const LOCATION_SETTINGS_KEY = 'location-settings';
const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';
const ANALYSIS_TIMEOUT_MS = 90000; // 90 seconds


export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    
    // Request microphone permission on component mount
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        setHasPermission(true);
        // Important: Stop the tracks immediately so the browser mic icon goes away
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(err => {
        console.error("Microphone permission denied:", err);
        setHasPermission(false);
      });

    const auth = getAuth(app);
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed:", error);
          logErrorToFirestore(error, 'anonymous-auth-failure', {});
        });
      }
    });
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
  
  const processAudio = (storagePath: string, recordingId: string): Promise<string | null> => {
    return new Promise((resolve) => {
      getLocationForAIShot(async (locationData) => {
          if (!currentCreationTime.current || !currentSessionId.current) {
              // This case should ideally not happen if logic is correct
              logErrorToFirestore(new Error("Missing session or timestamp for analysis."), 'internal-state-error', {});
              resolve(null);
              return;
          }
          
          const hardware = localStorage.getItem(HARDWARE_SETTINGS_KEY);
          
          try {
              const downloadUrl = await getDownloadURL(storageRef(storage, storagePath));
              const analysisRunId = await createAnalysisRun(
                  downloadUrl, storagePath, recordingId, locationData, hardware, 'newbie',
                  {}, // analysisTimings - will be calculated on server
                  currentSessionId.current, currentCreationTime.current!
              );
              resolve(analysisRunId);

          } catch (error) {
              logErrorToFirestore(error as Error, 'ai-identification-failure', {
                  sessionId: currentSessionId.current, creationTime: currentCreationTime.current,
                  locationData: locationData, userId: 'anonymous'
              });
              // In case of error, we still want to create a failed run and navigate
              try {
                const failedRunId = await createAnalysisRun(
                    '', storagePath, recordingId, locationData, hardware, 'newbie',
                    {}, currentSessionId.current, currentCreationTime.current!, error as Error
                );
                resolve(failedRunId);
              } catch (finalError) {
                logErrorToFirestore(finalError as Error, 'failed-run-creation-failure', { sessionId: currentSessionId.current });
                resolve(null); // Last resort
              }
          }
      });
    });
  };

  const handleStart = () => {
    setIsRecording(true);
    currentSessionId.current = uuidv4();
    currentCreationTime.current = new Date().toISOString();
  }

  const handleRecordingComplete = async (audioBlob: Blob | null) => {
    if (!audioBlob) {
        toast({
            variant: 'destructive',
            title: 'Recording Failed',
            description: 'No audio was recorded. Please check microphone permissions.',
        });
        setIsProcessing(false);
        return;
    }

    const recordingId = uuidv4();
    let analysisRunId: string | null = null;
  
    try {
      // 1. Upload audio directly to storage from the client
      const audioStoragePath = `recordings/${recordingId}.webm`;
      const fileRef = storageRef(storage, audioStoragePath);
      await uploadBytes(fileRef, audioBlob);
  
      // 2. Race the analysis against a timeout
      const timeoutPromise = new Promise<string | null>((_, reject) =>
        setTimeout(() => reject(new Error('Analysis timed out')), ANALYSIS_TIMEOUT_MS)
      );
  
      analysisRunId = await Promise.race([
        processAudio(audioStoragePath, recordingId),
        timeoutPromise
      ]);
  
    } catch (error) {
      console.error("Failed to process live recording:", error);
      const errorMessage = (error as Error).message || 'An unknown error occurred.';
      
      logErrorToFirestore(error as Error, 'live-audio-processing-failure', {
          userId: 'anonymous',
          recordingId,
      });

      if (errorMessage.includes('timed out')) {
          toast({
              variant: 'destructive',
              title: 'Analysis Timed Out',
              description: `The analysis took too long to complete. Please try again.`,
          });
      } else {
        toast({
            variant: 'destructive',
            title: 'Analysis Failed',
            description: 'Could not complete the analysis. This error has been logged.',
        });
      }
    } finally {
      setIsProcessing(false);
      // ALWAYS navigate, even on failure, if we have an ID.
      if (analysisRunId) {
        router.push(`/record/result/${analysisRunId}`);
      } else {
        // If we don't even have an ID, it's a critical failure.
        // Reset the UI and inform the user.
        toast({
            variant: 'destructive',
            title: 'Critical Failure',
            description: 'Could not create an analysis log. The process has been stopped. This error has been logged.'
        })
      }
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
          <div className="w-[60rem] h-[40rem] flex flex-col items-center justify-center">
            {hasPermission === false && (
                 <Alert variant="destructive" className="max-w-lg mb-8">
                  <MicOff className="h-4 w-4" />
                  <AlertTitle>Microphone Access Required</AlertTitle>
                  <AlertDescription>
                    This app needs access to your microphone to record audio. Please enable microphone permissions in your browser settings and refresh the page.
                  </AlertDescription>
                </Alert>
            )}
            <RecordButton
                onStart={handleStart}
                onStop={handleStop}
                onRecordingComplete={handleRecordingComplete}
                isRecording={isRecording}
                disabled={hasPermission !== true}
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
