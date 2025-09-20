
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { HomePageFooter } from '@/components/layout/HomePageFooter';
import { PrimaryHeader } from '@/components/layout/PrimaryHeader';
import { RecordButton } from '@/components/content/RecordButton';
import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { logErrorToFirestore } from '@/lib/error-logging';
import { identifyBirdBySound } from '@/ai/flows/contextual-identify-bird-flow';
import { createAnalysisRun } from '@/lib/actions';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { isDevMode } from '@/lib/utils';
import type { LocationSettings } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const LOCATION_SETTINGS_KEY = 'location-settings';
const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';


export default function Home() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
        
        try {
            const analysisStartTime = Date.now();
            const result = await identifyBirdBySound({
                audioStoragePath: storagePath,
                timestamp: currentTimestamp.current,
                ...locationData
            });
            const analysisDurationMs = Date.now() - analysisStartTime;
            const wasSuccessful = result && result.isBirdSong && !!result.commonName;

            analysisRunId = await createAnalysisRun(
                'anonymous', storagePath, result, wasSuccessful, locationData, hardware, 'newbie',
                isDeveloperRun, testContext,
                { primaryIdentificationMs: analysisDurationMs },
                currentSessionId.current!, currentTimestamp.current!
            );

        } catch (error) {
            const analysisDurationMs = Date.now() - (currentTimestamp.current ? new Date(currentTimestamp.current).getTime() : Date.now());
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
    setIsRecording(true);
    currentSessionId.current = uuidv4();
    currentTimestamp.current = new Date().toISOString();
  }

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsRecording(false);
    setIsProcessing(true);

    const isDevTest = isClient && isDevMode();
    const testContext = isDevTest ? { birdId: 'live-test', testAudioId: uuidv4() } : undefined;
    const tempUserId = 'anonymous';

    const recordingId = uuidv4();
    const filePath = `users/${tempUserId}/recordings/${recordingId}.webm`;
    const fileRef = storageRef(storage, filePath);

    try {
        await uploadBytes(fileRef, audioBlob);
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
  
  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
  }


  return (
    <AppLayout header={<PrimaryHeader />}>
      <main className="flex flex-1 flex-col items-center justify-center bg-muted p-4">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center gap-4 text-foreground/50">
            <Loader2 className="w-32 h-32 animate-spin" />
            <p className="text-4xl font-mono font-bold">Analyzing...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-0 pb-16">
              <RecordButton
                  onStartRecording={handleStartRecording}
                  onRecordingComplete={handleRecordingComplete}
                  onStopRecording={handleStopRecording}
                  isRecording={isRecording}
              />
          </div>
        )}
      </main>
      <HomePageFooter />
    </AppLayout>
  );
}
