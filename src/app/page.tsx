
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PrimaryHeader } from '@/components/layout/PrimaryHeader';
import { RecordButton } from '@/components/content/RecordButton';
import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { logErrorToFirestore } from '@/lib/error-logging';
import { identifyBirdBySound, type IdentifyBirdOutput } from '@/ai/flows/contextual-identify-bird-flow';
import { createAnalysisRun } from '@/lib/actions';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import type { LocationSettings } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ColorableLogo } from '@/components/content/ColorableLogo';
import { Loader2, BookImage, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';

const LOCATION_SETTINGS_KEY = 'location-settings';
const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';


export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

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
  
  const processAudio = (storagePath: string) => {
      getLocationForAIShot(async (locationData) => {
        setIsProcessing(true);
        if (!currentTimestamp.current || !currentSessionId.current) {
            setIsProcessing(false);
            return;
        }
        
        const hardware = localStorage.getItem(HARDWARE_SETTINGS_KEY);
        let result: IdentifyBirdOutput | null = null;
        let analysisRunId: string | null = null;
        
        try {
            const analysisStartTime = Date.now();
            result = await identifyBirdBySound({
                audioStoragePath: storagePath,
                timestamp: currentTimestamp.current!,
                ...locationData
            });
            const analysisDurationMs = Date.now() - analysisStartTime;
            const wasSuccessful = result && result.isBirdSong && !!result.commonName;

            analysisRunId = await createAnalysisRun(
                'anonymous', storagePath, result, wasSuccessful, locationData, hardware, 'newbie',
                { primaryIdentificationMs: analysisDurationMs },
                currentSessionId.current, currentTimestamp.current
            );

        } catch (error) {
            const analysisDurationMs = Date.now() - (currentTimestamp.current ? new Date(currentTimestamp.current).getTime() : Date.now());
            result = { error: (error as Error).message, isBirdSong: false };
            logErrorToFirestore(error as Error, 'ai-identification-failure', {
                sessionId: currentSessionId.current, timestamp: currentTimestamp.current,
                locationData: locationData, userId: 'anonymous'
            });
            
            analysisRunId = await createAnalysisRun(
                'anonymous', storagePath, result, false,
                locationData, hardware, 'newbie',
                { primaryIdentificationMs: analysisDurationMs },
                currentSessionId.current, currentTimestamp.current
            );
        } finally {
            if (analysisRunId) {
                router.push(`/record/result/${analysisRunId}`);
            } else {
                setIsProcessing(false);
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

    const tempUserId = 'anonymous';

    const recordingId = uuidv4();
    const filePath = `users/${tempUserId}/recordings/${recordingId}.webm`;
    const fileRef = storageRef(storage, filePath);

    try {
        await uploadBytes(fileRef, audioBlob);
        processAudio(filePath);

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
      <main className="flex flex-1 flex-col items-center justify-center bg-muted p-4 relative">
        <div className="absolute top-4 left-4 opacity-50">
            <SpeakerButton />
        </div>
        <div className="absolute top-4 right-4 opacity-50">
            <ContrastButton />
        </div>
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center gap-0 pb-16">
             <div className="w-[32rem] h-[32rem] p-12">
                <ColorableLogo className="w-full h-full animate-color-cycle" />
             </div>
            <div className="pl-4">
                <p className="text-6xl font-mono font-bold text-foreground text-center -mt-16 animate-color-cycle">Analyzing...</p>
            </div>
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
