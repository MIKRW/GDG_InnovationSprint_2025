
'use client';

import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

import { RecordButton } from '@/components/content/RecordButton';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { logErrorToFirestore } from '@/lib/error-logging';
import { identifyBirdBySound } from '@/ai/flows/contextual-identify-bird-flow';
import { createAnalysisRun } from '@/lib/actions';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { isDevMode } from '@/lib/utils';
import type { LocationSettings } from '@/lib/types';

const LOCATION_SETTINGS_KEY = 'location-settings';
const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';


export default function RecordPage() {
  const router = useRouter();
  
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Refs for managing state across async operations
  const currentSessionId = useRef<string | null>(null);
  const currentTimestamp = useRef<string | null>(null);

  const getLocationForAIShot = (
    callback: (locationData?: { latitude?: number; longitude?: number, locationDescription?: string }) => void
  ) => {
    const savedSettingsJson = localStorage.getItem(LOCATION_SETTINGS_KEY);
    let settings: LocationSettings = { mode: 'device', manual: { latitude: 0, longitude: 0 }, description: '', privacy: { isOutside: true } };
    if (savedSettingsJson) {
      try { settings = JSON.parse(savedSettingsJson); } catch { /* Fallback to default */ }
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

  const processAudio = (
    storagePath: string,
    isDeveloperRun: boolean,
    testContext?: { birdId: string; testAudioId: string }
  ) => {
      getLocationForAIShot(async (locationData) => {
        setIsProcessing(true);
        if (!currentTimestamp.current) {
            setIsProcessing(false);
            return;
        }
        
        const hardware = localStorage.getItem(HARDWARE_SETTINGS_KEY);
        let analysisRunId: string | null = null;
        
        const analysisStartTime = Date.now();
        try {
            const result = await identifyBirdBySound({
                audioStoragePath: storagePath,
                timestamp: currentTimestamp.current,
                ...locationData
            });
            const analysisDurationMs = Date.now() - analysisStartTime;
            const wasSuccessful = result && result.isBirdSong && !!result.commonName;

            // Since we are not saving logs, we create a temporary analysis run for the result page
            // The user ID is a placeholder now.
            analysisRunId = await createAnalysisRun(
                'anonymous', storagePath, result, wasSuccessful, locationData, hardware, 'newbie',
                isDeveloperRun, testContext,
                { primaryIdentificationMs: analysisDurationMs },
                currentSessionId.current!, currentTimestamp.current!
            );

        } catch (error) {
            const analysisDurationMs = Date.now() - analysisStartTime;
            logErrorToFirestore(error as Error, 'ai-identification-failure', {
                sessionId: currentSessionId.current, timestamp: currentTimestamp.current,
                locationData: locationData, userId: 'anonymous'
            });
            
            analysisRunId = await createAnalysisRun(
                'anonymous', storagePath, { error: (error as Error).message, isBirdSong: false }, false,
                locationData, hardware, 'newbie', isDeveloperRun, testContext,
                { primaryIdentificationMs: analysisDurationMs },
                currentSessionId.current!, currentTimestamp.current!
            );
        } finally {
            setIsProcessing(false);
            if (analysisRunId) {
                router.push(`/record/confirm/${analysisRunId}`);
            }
        }
      });
  };
  
  const handleStartRecording = () => {
    setShowPermissionError(false);
    currentSessionId.current = uuidv4();
    currentTimestamp.current = new Date().toISOString();
  }

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);

    const isDevTest = isClient && isDevMode();
    const testContext = isDevTest ? { birdId: 'live-test', testAudioId: uuidv4() } : undefined;

    // We use a placeholder user ID as we are no longer authenticating users.
    const tempUserId = 'anonymous';

    // 1. Upload the blob to Firebase Storage
    const recordingId = uuidv4();
    const filePath = `users/${tempUserId}/recordings/${recordingId}.webm`;
    const fileRef = storageRef(storage, filePath);

    try {
        await uploadBytes(fileRef, audioBlob);
        
        // 2. Once uploaded, call processAudio with the storage path
        processAudio(filePath, isDevTest, testContext);

    } catch (error) {
        console.error("Failed to upload live recording:", error);
        logErrorToFirestore(error as Error, 'live-audio-upload-failure', {
            userId: tempUserId,
            filePath: filePath,
        });
        setIsProcessing(false);
    }
  }

  return (
    <AppLayout header={<SecondaryHeader title="Microphone" />}>
      <main className="flex-1 flex items-center justify-center p-4 bg-muted relative">
        <div className="relative flex items-center justify-center w-80 h-[32rem]">

            <RecordButton 
              onPermissionDenied={() => setShowPermissionError(true)} 
              onStartRecording={handleStartRecording}
              onRecordingComplete={handleRecordingComplete}
              isProcessing={isProcessing}
            />

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
