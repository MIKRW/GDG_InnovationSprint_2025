
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
import { identifyBirdBySound, type IdentifyBirdOutput } from '@/ai/flows/contextual-identify-bird-flow';
import { createAnalysisRun } from '@/lib/actions';
import type { LocationSettings } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const LOCATION_SETTINGS_KEY = 'location-settings';
const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';
const ANALYSIS_TIMEOUT_MS = 90000; // 90 seconds


export default function RecordPage() {
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Refs for managing state across async operations
  const currentSessionId = useRef<string | null>(null);
  const currentTimestamp = useRef<string | null>(null);

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
            if (!currentTimestamp.current || !currentSessionId.current) {
                return reject(new Error("Missing session or timestamp for analysis."));
            }
            
            const hardware = localStorage.getItem(HARDWARE_SETTINGS_KEY);
            let result: IdentifyBirdOutput | null = null;
            let analysisRunId: string | null = null;
            
            try {
                const analysisStartTime = Date.now();
                result = await identifyBirdBySound({
                    audioDataUri: audioDataUri,
                    timestamp: currentTimestamp.current!,
                    ...locationData
                });
                const analysisDurationMs = Date.now() - analysisStartTime;
                const wasSuccessful = result && result.isBirdSong && !!result.commonName;

                analysisRunId = await createAnalysisRun(
                    'anonymous', audioDataUri, recordingId, result, wasSuccessful, locationData, hardware, 'newbie',
                    { primaryIdentificationMs: analysisDurationMs },
                    currentSessionId.current, currentTimestamp.current
                );
                resolve(analysisRunId);

            } catch (error) {
                const analysisDurationMs = Date.now() - (currentTimestamp.current ? new Date(currentTimestamp.current).getTime() : Date.now());
                result = { error: (error as Error).message, isBirdSong: false };
                logErrorToFirestore(error as Error, 'ai-identification-failure', {
                    sessionId: currentSessionId.current, timestamp: currentTimestamp.current,
                    locationData: locationData, userId: 'anonymous'
                });
                
                analysisRunId = await createAnalysisRun(
                    'anonymous', audioDataUri, recordingId, result, false,
                    locationData, hardware, 'newbie',
                    { primaryIdentificationMs: analysisDurationMs },
                    currentSessionId.current, currentTimestamp.current
                );
                resolve(analysisRunId);
            }
        });
      });
  };
  
  const handleStart = () => {
    setShowPermissionError(false);
    setIsRecording(true);
    currentSessionId.current = uuidv4();
    currentTimestamp.current = new Date().toISOString();
  }
  
  const handleStop = () => {
    setIsRecording(false);
    setIsProcessing(true);
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
            } catch(error) {
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
                  onPermissionDenied={() => setShowPermissionError(true)} 
                  onStart={handleStart}
                  onRecordingComplete={handleRecordingComplete}
                  isRecording={isRecording}
                  onStop={handleStop}
                />
            )}


             {showPermissionError && (
              <div className="absolute left-full ml-16 w-96">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-2xl">Microphone Access Required</AlertTitle>
                  <AlertDescription className="text-base">
                    This app needs access to your microphone. Please enable permissions in your browser settings and refresh the page.
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

    

    