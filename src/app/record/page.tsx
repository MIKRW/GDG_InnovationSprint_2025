
'use client';

import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

import { RecordButton } from '@/components/content/RecordButton';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { logErrorToFirestore } from '@/lib/error-logging';
import { identifyBirdBySound } from '@/ai/flows/contextual-identify-bird-flow';
import { createAnalysisRun } from '@/lib/actions';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { useIsDevMode } from '@/hooks/useIsDevMode';
import type { AppMode, LocationSettings } from '@/lib/types';

const LOCATION_SETTINGS_KEY = 'location-settings';
const APP_MODE_SETTINGS_KEY = 'app-mode-settings';
const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';


export default function RecordPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isDevMode = useIsDevMode();

  // Refs for managing state across async operations
  const currentSessionId = useRef<string | null>(null);
  const currentTimestamp = useRef<string | null>(null);

  
  const getAppSettings = (): { mode: AppMode } => {
    const savedSettingsJson = localStorage.getItem(APP_MODE_SETTINGS_KEY);
    const defaultSettings: { mode: AppMode } = { mode: 'newbie' };
    if (savedSettingsJson) {
        try {
            const parsed = JSON.parse(savedSettingsJson);
            if (parsed.mode === 'newbie' || parsed.mode === 'twitcher') {
                return { mode: parsed.mode };
            }
        } catch { return defaultSettings; }
    }
    return defaultSettings;
  }

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
        if (!currentTimestamp.current || !user) {
            setIsProcessing(false);
            return;
        }
        const appSettings = getAppSettings();
        const hardware = localStorage.getItem(HARDWARE_SETTINGS_KEY);
        let analysisRunId: string | null = null;
        
        const analysisStartTime = Date.now();
        try {
            const result = await identifyBirdBySound({
                audioStoragePath: storagePath,
                timestamp: currentTimestamp.current,
                mode: appSettings.mode,
                isDevelopment: isDevMode,
                ...locationData
            });
            const analysisDurationMs = Date.now() - analysisStartTime;
            const wasSuccessful = result && result.isBirdSong && !!result.commonName;

            analysisRunId = await createAnalysisRun(
                user.uid, storagePath, result, wasSuccessful, locationData, hardware,
                appSettings.mode, isDeveloperRun, testContext,
                { primaryIdentificationMs: analysisDurationMs },
                currentSessionId.current!, currentTimestamp.current!
            );

        } catch (error) {
            const analysisDurationMs = Date.now() - analysisStartTime;
            logErrorToFirestore(error as Error, 'ai-identification-failure', {
                sessionId: currentSessionId.current, timestamp: currentTimestamp.current,
                locationData: locationData, appMode: appSettings.mode, userId: user?.uid
            });
            
            analysisRunId = await createAnalysisRun(
                user.uid, storagePath, { error: (error as Error).message, isBirdSong: false }, false,
                locationData, hardware, appSettings.mode, isDeveloperRun, testContext,
                { primaryIdentificationMs: analysisDurationMs },
                currentSessionId.current!, currentTimestamp.current!
            );
        } finally {
            if (analysisRunId) {
                router.push(`/record/confirm/${analysisRunId}`);
            }
            setIsProcessing(false);
        }
      });
  };
  
  const handleStartRecording = () => {
    setShowPermissionError(false);
    currentSessionId.current = uuidv4();
    currentTimestamp.current = new Date().toISOString();
  }

  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (!user) return;
    setIsProcessing(true);

    const isDevTest = isDevMode;
    const testContext = isDevTest ? { birdId: 'live-test', testAudioId: uuidv4() } : undefined;

    // 1. Upload the blob to Firebase Storage
    const recordingId = uuidv4();
    const filePath = `users/${user.uid}/recordings/${recordingId}.webm`;
    const fileRef = storageRef(storage, filePath);

    try {
        await uploadBytes(fileRef, audioBlob);
        
        // 2. Once uploaded, call processAudio with the storage path
        processAudio(filePath, isDevTest, testContext);

    } catch (error) {
        console.error("Failed to upload live recording:", error);
        logErrorToFirestore(error as Error, 'live-audio-upload-failure', {
            userId: user.uid,
            filePath: filePath,
        });
        setIsProcessing(false);
    }
  }

  return (
    <AppLayout header={<SecondaryHeader title="Microphone" />}>
      <main className="flex-1 flex items-center justify-center p-4 bg-muted relative">
        <div className="relative flex items-center justify-center">

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
