
'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';

import { identifyBirdBySound } from '@/ai/flows/identify-bird-flow';
import { db, storage } from '@/lib/firebase';
import type { BirdLog, LocationSettings, AppSettings, AppMode } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MicrophoneIcon } from './MicrophoneIcon';
import { Loader2, MicOff, Square } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { logErrorToFirestore } from '@/lib/error-logging';

type RecordingState =
  | 'idle'
  | 'denied'
  | 'recording'
  | 'processing'
  | 'confirming';

interface RecordButtonProps {
    onPermissionDenied?: () => void;
    onIdentificationFailed?: () => void;
    onStartRecording?: () => void;
}

const LOCATION_SETTINGS_KEY = 'location-settings';
const APP_MODE_SETTINGS_KEY = 'app-mode-settings';
const PROMPT_VERSION = "1.1"; // Updated for weather tool


const RecordButton = forwardRef(({ onPermissionDenied, onIdentificationFailed, onStartRecording }: RecordButtonProps, ref) => {
  const router = useRouter();
  const [recordingState, setRecordingState] =
    useState<RecordingState>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [lastAudio, setLastAudio] = useState<string | null>(null);
  const currentSessionId = useRef<string | null>(null);
  const currentTimestamp = useRef<string | null>(null);


  useImperativeHandle(ref, () => ({
    handleFileSelect(file: File) {
      if (currentSessionId.current === null) {
        currentSessionId.current = uuidv4();
      }
      // Set the timestamp when the file is selected
      currentTimestamp.current = new Date().toISOString();

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        setRecordingState('processing');
        // For dev uploads, we pass a special flag to processAudio
        processAudio(base64Audio, undefined, true);
      };
    }
  }));


  const handleStartRecording = async () => {
    onStartRecording?.();
    if (recordingState === 'denied') {
        onPermissionDenied?.();
        return;
    }

    currentSessionId.current = uuidv4();
    currentTimestamp.current = new Date().toISOString();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.addEventListener(
        'dataavailable',
        (event: BlobEvent) => {
          audioChunksRef.current.push(event.data);
        }
      );

      mediaRecorderRef.current.addEventListener('stop', handleStop);

      mediaRecorderRef.current.start();
      setRecordingState('recording');
    } catch (err) {
      console.error('Permission denied or no microphone found:', err);
      setRecordingState('denied');
      onPermissionDenied?.();
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      // Stop all audio tracks to turn off the microphone indicator
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const saveToFirestore = async (log: Omit<BirdLog, 'id' | 'userId'>, audioDataUri: string, aiResult: any, wasSuccessful: boolean) => {
    console.warn("Auth system is disabled. Skipping Firestore save.");
    // Simulate a successful save for navigation purposes
    router.push(`/log`);
    return null;
  };


  const saveMysteryLog = async (audioDataUri: string, aiResult: any, locationData?: { latitude?: number; longitude?: number; locationDescription?: string; }) => {
    console.warn("Auth system is disabled. Skipping Firestore save for mystery log.");
    // Just reset the state and navigate
    setRecordingState('idle');
    setLastAudio(null);
    router.push(`/log`);
  };

  const handleSaveConfirmation = () => {
    if (lastAudio) {
        const [audioData, aiResult] = JSON.parse(lastAudio);
        // Re-fetch location based on settings when user confirms save
        getLocationForAIShot(locationData => saveMysteryLog(audioData, aiResult, locationData));
    }
  };

  const handleCancelSave = async () => {
    console.warn("Auth system is disabled. Discarding log.");
    setRecordingState('idle');
    setLastAudio(null);
    onIdentificationFailed?.();
  };

  const handleStop = async () => {
    setRecordingState('processing');
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        getLocationForAIShot(locationData => processAudio(base64Audio, locationData));
    };
  };

  const getAppSettings = (): AppSettings => {
    const savedSettingsJson = localStorage.getItem(APP_MODE_SETTINGS_KEY);
    const defaultSettings: AppSettings = { mode: 'newbie' };
    if (savedSettingsJson) {
        try {
            const parsed = JSON.parse(savedSettingsJson);
            // Ensure mode is a valid AppMode
            if (parsed.mode === 'newbie' || parsed.mode === 'twitcher') {
                return { mode: parsed.mode };
            }
        } catch {
             return defaultSettings;
        }
    }
    return defaultSettings;
  }

  const getLocationForAIShot = (
    callback: (locationData?: { latitude?: number; longitude?: number, locationDescription?: string }) => void
  ) => {
    const savedSettingsJson = localStorage.getItem(LOCATION_SETTINGS_KEY);
    let settings: LocationSettings = { mode: 'device', manual: { latitude: 0, longitude: 0 }, description: '', privacy: { isOutside: true } };
    if (savedSettingsJson) {
      try {
        settings = JSON.parse(savedSettingsJson);
      } catch {
        // Fallback to default
      }
    }

    if (settings.mode === 'device') {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          callback({ latitude, longitude });
        },
        () => {
          console.warn('Geolocation failed or denied. Proceeding without it.');
          callback(); // Proceed without location
        }
      );
    } else if (settings.mode === 'manual') {
      callback(settings.manual);
    } else if (settings.mode === 'description') {
      callback({ locationDescription: settings.description });
    }
    else { // privacy mode
      callback(); // No location data
    }
  };

  const saveTestRunToFirestore = async (result: any) => {
    try {
      const testRunData = {
          aiResult: result,
          timestamp: currentTimestamp.current!,
          promptVersion: PROMPT_VERSION,
          birdId: "australian-magpie", // Placeholder
          testAudioId: "magpie-warble-1", // Placeholder
      };
      await addDoc(collection(db, 'all_test_runs'), testRunData);
    } catch (error) {
       console.error('Error saving test run to Firestore:', error);
       logErrorToFirestore(error as Error, 'firestore-write-failure', {
         collection: 'all_test_runs',
         operation: 'addDoc',
       });
       // Optionally, inform the user that saving the test run failed
    }
  }


  const processAudio = async (base64Audio: string, locationData?: { latitude?: number, longitude?: number, locationDescription?: string }, isTestRun = false) => {
    if (!currentTimestamp.current) {
      setRecordingState('idle');
      return;
    }
    const appSettings = getAppSettings();
    
    try {
      const result = await identifyBirdBySound({ 
          audioDataUri: base64Audio,
          timestamp: currentTimestamp.current,
          mode: appSettings.mode,
          ...locationData
      });

      if (isTestRun) {
        await saveTestRunToFirestore(result);
        setRecordingState('idle');
        router.push('/log/test'); // Navigate to test log page after test run
        return;
      }

      if (result && result.isBirdSong && result.commonName && result.scientificName && result.description && result.imagePrompt) {
          const newLogData = {
              sessionId: currentSessionId.current!,
              timestamp: currentTimestamp.current!,
              commonName: result.commonName,
              scientificName: result.scientificName,
              family: result.family,
              order: result.order,
              description: result.description,
              imagePrompt: result.imagePrompt,
              isMystery: false,
              season: result.season,
              weather: result.weather,
              mode: appSettings.mode,
              ...locationData,
          };
          await saveToFirestore(newLogData, base64Audio, result, true);
          router.push(`/log`);
      } else {
           // AI failed, trigger confirmation
           // We now store the audio data AND the raw AI result
           setLastAudio(JSON.stringify([base64Audio, result]));
           setRecordingState('confirming');
      }
    } catch (error) {
      console.error('Error identifying bird sound:', error);
      // Log the error to Firestore
      logErrorToFirestore(error as Error, 'ai-identification-failure', {
        sessionId: currentSessionId.current,
        timestamp: currentTimestamp.current,
        locationData: locationData,
        appMode: appSettings.mode
      });
      // API failed, trigger confirmation, store the error as the result
      setLastAudio(JSON.stringify([base64Audio, { error: (error as Error).message }]));
      setRecordingState('confirming');
    }
  }


  const handleClick = () => {
    if (recordingState === 'recording') {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const getButtonContent = () => {
    switch (recordingState) {
      case 'recording':
        return {
          icon: <Square className="w-40 h-40 text-background" />,
          label: 'Press to Stop',
        };
      case 'processing':
      case 'confirming':
        return {
          icon: <Loader2 className="w-40 h-40 text-background animate-spin" />,
          label: 'Analyzing...',
        };
      case 'denied':
         return {
          icon: <MicOff className="w-40 h-40 text-background" />,
          label: 'Microphone Access Denied',
        };
      default: // idle
        return {
          icon: <MicrophoneIcon />,
          label: 'Press to Record',
        };
    }
  };

  const { icon, label } = getButtonContent();
  const isDisabled = recordingState === 'processing' || recordingState === 'confirming';


  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="w-96 h-[36rem] rounded-full bg-foreground hover:bg-foreground/90 flex flex-col-reverse justify-center items-center gap-8 transition-all duration-300 ease-in-out"
        aria-label="Record Audio"
        onClick={handleClick}
        disabled={isDisabled}
      >
        <div className="text-background text-center text-2xl">
          <p className="text-xl">{label}</p>
        </div>
        {icon}
      </Button>

      <AlertDialog open={recordingState === 'confirming'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No bird identified</AlertDialogTitle>
            <AlertDialogDescription>
              The AI could not identify a bird song in this recording. Would you like to save it as a "Mystery Recording" to review later? (This feature is temporarily disabled).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSave}>Discard</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveConfirmation} disabled>Save Recording</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
RecordButton.displayName = "RecordButton";

export { RecordButton };
