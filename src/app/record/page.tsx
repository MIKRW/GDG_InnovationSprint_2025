
'use client';

import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { RecordButton } from '@/components/content/RecordButton';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { logErrorToFirestore } from '@/lib/error-logging';
import { createAnalysisRun } from '@/lib/actions';
import type { LocationSettings } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const LOCATION_SETTINGS_KEY = 'location-settings';
const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';
const ANALYSIS_TIMEOUT_MS = 90000; // 90 seconds


export default function RecordPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    setIsClient(true);
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
        setHasPermission(permissionStatus.state === 'granted');
        permissionStatus.onchange = () => {
            setHasPermission(permissionStatus.state === 'granted');
        };
    });
  }, []);

  // Refs for managing state across async operations
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
                logErrorToFirestore(new Error("Missing session or timestamp for analysis."), 'internal-state-error', {});
                resolve(null);
                return;
            }
            
            const hardware = localStorage.getItem(HARDWARE_SETTINGS_KEY);
            
            try {
                const analysisRunId = await createAnalysisRun(
                    storagePath, recordingId, locationData, hardware, 'newbie',
                    {},
                    currentSessionId.current, currentCreationTime.current!
                );
                resolve(analysisRunId);

            } catch (error) {
                logErrorToFirestore(error as Error, 'ai-identification-failure', {
                    sessionId: currentSessionId.current, creationTime: currentCreationTime.current,
                    locationData: locationData, userId: 'anonymous'
                });
                try {
                    const failedRunId = await createAnalysisRun(
                        storagePath, recordingId, locationData, hardware, 'newbie',
                        {}, currentSessionId.current, currentCreationTime.current!, error as Error
                    );
                    resolve(failedRunId);
                } catch (finalError) {
                    logErrorToFirestore(finalError as Error, 'failed-run-creation-failure', { sessionId: currentSessionId.current });
                    resolve(null);
                }
            }
        });
      });
  };
  
  const handleStart = async () => {
    if (hasPermission === false) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(true);
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Microphone Required',
          description: 'You must grant microphone access to record audio.',
        });
        setIsRecording(false);
      }
    } else {
      setIsRecording(true);
    }
  };
  
  useEffect(() => {
    if (isRecording) {
      currentSessionId.current = uuidv4();
      currentCreationTime.current = new Date().toISOString();
    }
  }, [isRecording]);
  
  const handleStop = () => {
    setIsRecording(false);
  }

  const handleRecordingComplete = async (audioBlob: Blob | null) => {
    setIsRecording(false);
    
    if (!audioBlob) {
        toast({
            variant: 'destructive',
            title: 'Recording Failed',
            description: 'No audio was recorded. Please check microphone permissions.',
        });
        return;
    }
    
    setIsProcessing(true);
    const recordingId = uuidv4();
    let analysisRunId: string | null = null;

    try {
        const audioStoragePath = `recordings/${recordingId}.wav`;
        const fileRef = storageRef(storage, audioStoragePath);
        await uploadBytes(fileRef, audioBlob);
        
        const timeoutPromise = new Promise<string | null>((_, reject) => 
            setTimeout(() => reject(new Error('Analysis timed out')), ANALYSIS_TIMEOUT_MS)
        );

        analysisRunId = await Promise.race([
            processAudio(audioStoragePath, recordingId),
            timeoutPromise
        ]);

    } catch(error) {
         console.error("Failed to process live recording:", error);
        logErrorToFirestore(error as Error, 'live-audio-processing-failure', {
            userId: 'anonymous',
            recordingId,
        });
        if ((error as Error).message.includes('timed out')) {
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
  }

  return (
    <AppLayout header={<SecondaryHeader title="Microphone" />}>
      <main className="flex-1 flex items-center justify-center p-4 bg-muted relative">
        <div className="relative flex items-center justify-center w-full h-full">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center gap-4 text-foreground/50">
                <Loader2 className="w-80 h-80 animate-spin" />
                <p className="text-4xl font-mono font-bold">Analyzing...</p>
              </div>
            ) : (
                <RecordButton 
                  onStart={handleStart}
                  onRecordingComplete={handleRecordingComplete}
                  isRecording={isRecording}
                  hasPermission={hasPermission}
                  onStop={handleStop}
                />
            )}


             {hasPermission === false && !isRecording && (
              <div className="absolute left-full ml-16 w-96">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-2xl">Microphone Access Required</AlertTitle>
                  <AlertDescription className="text-base">
                    Click the record button to grant microphone access.
                  </AlertDescription>
                </Alert>
              </div>
            )}
        </div>
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
