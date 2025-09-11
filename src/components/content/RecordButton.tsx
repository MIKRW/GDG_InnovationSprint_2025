
'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import { identifyBirdBySound } from '@/ai/flows/identify-bird-flow';
import { addLog } from '@/lib/local-storage';
import type { BirdLog, LocationSettings, AppSettings, AppMode } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MicrophoneIcon } from './MicrophoneIcon';
import { Loader2, MicOff, Square } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

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


const RecordButton = forwardRef(({ onPermissionDenied, onIdentificationFailed, onStartRecording }: RecordButtonProps, ref) => {
  const router = useRouter();
  const [recordingState, setRecordingState] =
    useState<RecordingState>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [lastAudio, setLastAudio] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    handleFileSelect(file: File) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        setRecordingState('processing');
        getLocationForAIShot(locationData => processAudio(base64Audio, locationData));
      };
    }
  }));


  const handleStartRecording = async () => {
    onStartRecording?.();
    if (recordingState === 'denied') {
        onPermissionDenied?.();
        return;
    }

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

  const saveMysteryLog = (audioDataUri: string, locationData?: { latitude?: number; longitude?: number; locationDescription?: string; }) => {
    const newLog: BirdLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      commonName: 'Mystery Recording',
      scientificName: 'Audio captured',
      description: 'The AI could not identify a bird in this recording. You can listen to the recording here.',
      imagePrompt: 'question mark',
      audioUrl: audioDataUri,
      isMystery: true,
      ...locationData,
    };
    addLog(newLog);
    setRecordingState('idle');
    setLastAudio(null);
    router.push(`/log/mystery`);
  };

  const handleSaveConfirmation = () => {
    if (lastAudio) {
      // Re-fetch location based on settings when user confirms save
      getLocationForAIShot(locationData => saveMysteryLog(lastAudio, locationData));
    }
  };

  const handleCancelSave = () => {
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


  const processAudio = async (base64Audio: string, locationData?: { latitude?: number, longitude?: number, locationDescription?: string }) => {
    const appSettings = getAppSettings();
    
    try {
      const result = await identifyBirdBySound({ 
          audioDataUri: base64Audio,
          mode: appSettings.mode,
          ...locationData
      });
      let newLog: BirdLog;

      if (result && result.isBirdSong && result.commonName && result.scientificName && result.description && result.imagePrompt) {
          newLog = {
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              commonName: result.commonName,
              scientificName: result.scientificName,
              description: result.description,
              imagePrompt: result.imagePrompt,
              audioUrl: base64Audio,
              isMystery: false,
              ...locationData,
          };
          addLog(newLog);
          router.push(`/log`);
      } else {
           // AI failed, trigger confirmation
           setLastAudio(base64Audio);
           setRecordingState('confirming');
      }
    } catch (error) {
      console.error('Error identifying bird sound:', error);
      // API failed, trigger confirmation
      setLastAudio(base64Audio);
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
              The AI could not identify a bird song in this recording. Would you like to save it as a "Mystery Recording" to review later?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSave}>Discard</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveConfirmation}>Save Recording</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
RecordButton.displayName = "RecordButton";

export { RecordButton };
