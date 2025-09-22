
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { RecordButton } from '@/components/content/RecordButton';
import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { logErrorToFirestore } from '@/lib/error-logging';
import { createAnalysisRun } from '@/lib/actions';
import type { AnalysisRun, LocationSettings } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ColorableLogo } from '@/components/content/ColorableLogo';
import { BookImage, Settings, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { app, auth, storage } from '@/lib/firebase';
import { uploadBytes, ref as storageRef } from 'firebase/storage';
import { useSpeaker } from '@/hooks/use-speaker';
import { ResultDisplay } from '@/components/content/ResultDisplay';

const LOCATION_ENABLED_KEY = 'location-sharing-enabled';
const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';
const ANALYSIS_TIMEOUT_MS = 90000; // 90 seconds

const PAGE_NARRATION = "/audio/narration/narration-main-page.wav";
const FIRST_INTERACTION_KEY = 'user-has-interacted';

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { playNarration, ...speakerProps } = useSpeaker(PAGE_NARRATION, 'general');
  const currentSessionId = useRef<string | null>(null);
  const currentCreationTime = useRef<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Check initial permission status without prompting
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
        setHasPermission(permissionStatus.state === 'granted');
        permissionStatus.onchange = () => {
            setHasPermission(permissionStatus.state === 'granted');
        };
    });

    onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed:", error);
          logErrorToFirestore(error, 'anonymous-auth-failure', {});
        });
      }
    });

  }, []);

  const handleStop = () => {
    setIsRecording(false);
  };

  const getLocationForAIShot = (
    callback: (locationData?: { latitude?: number; longitude?: number }) => void
  ) => {
    if (!isClient) {
      callback();
      return;
    }
    const locationEnabled = localStorage.getItem(LOCATION_ENABLED_KEY);
    // Default to 'true' if not set
    const isSharingEnabled = locationEnabled ? JSON.parse(locationEnabled) : true;

    if (isSharingEnabled) {
      navigator.geolocation.getCurrentPosition(
        (position) => callback({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => callback() // Proceed without location on error/denial
      );
    } else {
        // Location sharing is disabled
      callback();
    }
  };
  
  const processAudio = (storagePath: string, recordingId: string, audioDataUri: string): Promise<AnalysisRun | null> => {
    return new Promise((resolve) => {
      getLocationForAIShot(async (locationData) => {
          if (!currentCreationTime.current || !currentSessionId.current) {
              logErrorToFirestore(new Error("Missing session or timestamp for analysis."), 'internal-state-error', {});
              resolve(null);
              return;
          }
          
          const hardware = localStorage.getItem(HARDWARE_SETTINGS_KEY);
          
          try {
              const run = await createAnalysisRun(
                  storagePath, recordingId, audioDataUri, locationData, hardware, 'newbie',
                  {},
                  currentSessionId.current, currentCreationTime.current!
              );
              resolve(run);

          } catch (error) {
              logErrorToFirestore(error as Error, 'ai-identification-failure', {
                  sessionId: currentSessionId.current, creationTime: currentCreationTime.current,
                  locationData: locationData, userId: 'anonymous'
              });
              try {
                const failedRun = await createAnalysisRun(
                    storagePath, recordingId, audioDataUri, locationData, hardware, 'newbie',
                    {}, currentSessionId.current, currentCreationTime.current!, error as Error
                );
                resolve(failedRun);
              } catch (finalError) {
                logErrorToFirestore(finalError as Error, 'failed-run-creation-failure', { sessionId: currentSessionId.current });
                resolve(null);
              }
          }
      });
    });
  };

 const handleRecordingComplete = async (audioBlob: Blob | null) => {
    setIsRecording(false); // Stop recording UI first

    if (!audioBlob) {
        toast({
            variant: 'destructive',
            title: 'Recording Failed',
            description: 'No audio was recorded. Please check microphone and permissions.',
        });
        return;
    }
    
    setIsUploading(true);

    const recordingId = uuidv4();
    let finalAnalysisRun: AnalysisRun | null = null;
  
    try {
      const audioStoragePath = `recordings/${recordingId}.wav`;
      const fileRef = storageRef(storage, audioStoragePath);
      
      await uploadBytes(fileRef, audioBlob);
      
      setIsUploading(false);
      setIsAnalyzing(true);
      
      const audioDataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const timeoutPromise = new Promise<AnalysisRun | null>((_, reject) =>
        setTimeout(() => reject(new Error('Analysis timed out')), ANALYSIS_TIMEOUT_MS)
      );
  
      finalAnalysisRun = await Promise.race([
        processAudio(audioStoragePath, recordingId, audioDataUri),
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
    } 
    
    if (finalAnalysisRun) {
        router.push(`/record/result?id=${finalAnalysisRun.id}`);
    } else {
        setIsUploading(false);
        setIsAnalyzing(false);
        toast({
            variant: 'destructive',
            title: 'Critical Failure',
            description: 'Could not create an analysis log. The process has been stopped. This error has been logged.'
        })
    }
  }

 const handleStart = async () => {
    currentSessionId.current = uuidv4();
    currentCreationTime.current = new Date().toISOString();
    
    if (hasPermission === false) {
      try {
        // Request permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        // Stop the tracks immediately so we don't leave the mic on
        stream.getTracks().forEach(track => track.stop());
        // Now that we have permission, we can proceed to start recording
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone permission denied by user.", err);
        toast({
          variant: 'destructive',
          title: 'Microphone Required',
          description: 'You must grant microphone access to record audio.',
        });
        setIsRecording(false);
      }
    } else {
      // Permission is already granted
      setIsRecording(true);
    }
  };

  return (
    <AppLayout>
      <main className="flex flex-1 flex-col items-center justify-center bg-muted p-4 relative">
        <div className="absolute top-4 left-4 opacity-50">
            <SpeakerButton onClick={() => playNarration()} {...speakerProps} />
        </div>
        <div className="absolute top-4 right-4 opacity-50">
            <ContrastButton />
        </div>
        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-0 pb-16 w-[60rem] h-[40rem]">
             <div className="w-[40rem] h-[40rem] p-12">
                <ColorableLogo className="w-full h-full text-foreground" />
             </div>
            <div className="pl-4">
                <p className="text-8xl font-mono font-bold text-foreground text-center -mt-16">Uploading...</p>
            </div>
          </div>
        ) : isAnalyzing ? (
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
            <RecordButton
                onStart={handleStart}
                onStop={handleStop}
                onRecordingComplete={handleRecordingComplete}
                isRecording={isRecording}
                hasPermission={hasPermission}
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
