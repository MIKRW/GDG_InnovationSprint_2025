

'use-client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc, collection, addDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';

import { identifyBirdBySound } from '@/ai/flows/identify-bird-flow';
import { db, storage } from '@/lib/firebase';
import type { BirdLog, LocationSettings, AppSettings, AppMode, AnalysisRun } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MicrophoneIcon } from './MicrophoneIcon';
import { Loader2, MicOff, Square } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { logErrorToFirestore } from '@/lib/error-logging';
import { useAuth } from '@/components/providers/AuthProvider';

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
const PROMPT_VERSION = "1.7"; // Separated dev/user flows

const RecordButton = forwardRef(({ onPermissionDenied, onIdentificationFailed, onStartRecording }: RecordButtonProps, ref) => {
  const router = useRouter();
  const { user } = useAuth();
  const [recordingState, setRecordingState] =
    useState<RecordingState>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);
  const [lastAudio, setLastAudio] = useState<string | null>(null);
  const currentSessionId = useRef<string | null>(null);
  const currentTimestamp = useRef<string | null>(null);
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';


  useImperativeHandle(ref, () => ({
    handleFileSelect: async (file: File, testContext?: { birdId: string, testAudioId: string }) => {
      if (currentSessionId.current === null) {
        currentSessionId.current = uuidv4();
      }
      currentTimestamp.current = new Date().toISOString();

      const audio = new Audio(URL.createObjectURL(file));
      audio.onloadedmetadata = () => {
        const duration = audio.duration;
         const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = async () => {
              const base64Audio = reader.result as string;
              setRecordingState('processing');
              await processAudio(base64Audio, duration, undefined, testContext);
          };
          reader.onerror = () => {
              console.error("Failed to read file for test run.");
              setRecordingState('idle');
          }
      };
    }
  }));


  const handleStartRecording = async () => {
    onStartRecording?.();
    if (recordingState === 'denied' || !user) {
        if (!user) console.error("Cannot record: User not authenticated.");
        if (recordingState === 'denied') onPermissionDenied?.();
        return;
    }

    currentSessionId.current = uuidv4();
    currentTimestamp.current = new Date().toISOString();
    recordingStartTimeRef.current = Date.now();

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

   const createAnalysisRun = async (
        audioDataUri: string, 
        aiResult: any, 
        wasSuccessful: boolean, 
        locationData: any, 
        mode: AppMode, 
        isDeveloperRun: boolean,
        recordingLengthSeconds?: number,
        analysisTimings?: AnalysisRun['analysisTimings']
    ) => {
     if (!user) {
      console.error("Cannot create analysis run: user is not authenticated.");
      logErrorToFirestore(new Error("Analysis run failed: No user."), 'firestore-write-failure', { detail: 'User not authenticated during createAnalysisRun.'});
      return null;
    }

    // 1. Upload audio to Firebase Storage
    const audioId = uuidv4();
    const filePath = `users/${user.uid}/recordings/${audioId}.webm`;
    const fileRef = storageRef(storage, filePath);
    await uploadString(fileRef, audioDataUri, 'data_url');
    const downloadURL = await getDownloadURL(fileRef);

    // 2. Create the analysis document
    const analysisRunId = uuidv4();
    const analysisRunRef = doc(db, 'all_analysis_runs', analysisRunId);

    await setDoc(analysisRunRef, {
      id: analysisRunId,
      timestamp: currentTimestamp.current!,
      userId: user.uid,
      sessionId: currentSessionId.current!,
      inputAudioUrl: downloadURL,
      inputAudioStoragePath: filePath,
      locationData: {
        latitude: locationData?.latitude ?? null,
        longitude: locationData?.longitude ?? null,
        locationDescription: locationData?.locationDescription ?? null,
      },
      analysisMethod: `gemini-pro-vision-prompt-v${PROMPT_VERSION}`,
      aiResult: aiResult,
      wasSuccessful: wasSuccessful,
      wasSavedByUser: false, 
      mode: mode,
      isDeveloperData: isDeveloperRun,
      recordingLengthSeconds: recordingLengthSeconds,
      analysisTimings: analysisTimings,
    });

    return analysisRunId;
  }

  const createTestRun = async (
    aiResult: any, 
    source: 'master_audio' | 'live_recording',
    testContext?: { birdId: string, testAudioId: string }
  ) => {
      await addDoc(collection(db, 'all_test_runs'), {
        timestamp: currentTimestamp.current!,
        promptVersion: PROMPT_VERSION,
        aiResult: aiResult,
        source: source,
        birdId: testContext?.birdId,
        testAudioId: testContext?.testAudioId,
      });
  }


  const saveMysteryLog = async (audioDataUri: string, analysisRunId: string, locationData?: { latitude?: number; longitude?: number; locationDescription?: string; }) => {
     if (!user) {
      console.error("Cannot save mystery log: user is not authenticated.");
      logErrorToFirestore(new Error("Save attempt failed: No user."), 'firestore-write-failure', { detail: 'User was not authenticated during saveMysteryLog call.'});
      setRecordingState('idle');
      return;
    }
    
    // Create the user-facing log entry
    const logId = uuidv4();
    const logDocRef = doc(db, 'users', user.uid, 'identifications', logId);

    // Fetch the download URL from the analysis run document
    const analysisRunRef = doc(db, 'all_analysis_runs', analysisRunId);
    const analysisRunSnap = await getDoc(analysisRunRef);
    if (!analysisRunSnap.exists()) {
        console.error("Could not find analysis run to create mystery log.");
        return;
    }
    const analysisRunData = analysisRunSnap.data();
    const audioUrl = analysisRunData.inputAudioUrl;

    const mysteryLogData: Omit<BirdLog, 'id'> = {
      sessionId: currentSessionId.current!,
      analysisRunId: analysisRunId,
      userId: user.uid,
      timestamp: currentTimestamp.current!,
      commonName: 'Mystery Bird',
      scientificName: 'Unknown',
      description: 'This is a recording that could not be identified by the AI. You can listen to it here and try to identify it yourself!',
      imagePrompt: 'question mark',
      audioUrl: audioUrl,
      isMystery: true,
      status: 'active',
      mode: getAppSettings().mode,
      ...locationData,
    };
    
    await setDoc(logDocRef, mysteryLogData);
     await updateDoc(analysisRunRef, { wasSavedByUser: true });

    setRecordingState('idle');
    setLastAudio(null);
    router.push(`/log/${logId}`);
  };

  const handleSaveConfirmation = () => {
    if (lastAudio) {
        const [audioData, analysisRunId] = JSON.parse(lastAudio);
        // Re-fetch location based on settings when user confirms save
        getLocationForAIShot(locationData => saveMysteryLog(audioData, analysisRunId, locationData));
    }
  };

  const handleCancelSave = async () => {
    setRecordingState('idle');
    setLastAudio(null);
    onIdentificationFailed?.();
    router.push('/log');
  };

  const handleStop = async () => {
    setRecordingState('processing');
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const recordingLengthSeconds = recordingStartTimeRef.current ? parseFloat(((Date.now() - recordingStartTimeRef.current) / 1000).toFixed(2)) : undefined;

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        // In dev mode, a live recording is a test run.
        const testContext = isDevMode ? { birdId: 'live-test', testAudioId: uuidv4() } : undefined;
        getLocationForAIShot(locationData => processAudio(base64Audio, recordingLengthSeconds, locationData, testContext));
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

  const processAudio = async (base64Audio: string, recordingLengthSeconds?: number, locationData?: { latitude?: number, longitude?: number, locationDescription?: string }, testContext?: { birdId: string, testAudioId: string }) => {
    if (!currentTimestamp.current) {
      setRecordingState('idle');
      return;
    }
    const appSettings = getAppSettings();
    
    // A developer run happens if we are in dev mode OR if there is testContext from a master audio file
    const isDeveloperRun = isDevMode;

    try {
      const analysisStartTime = Date.now();
      const result = await identifyBirdBySound({ 
          audioDataUri: base64Audio,
          timestamp: currentTimestamp.current,
          mode: appSettings.mode,
          ...locationData
      });
      const analysisDurationMs = Date.now() - analysisStartTime;
      
      const wasSuccessful = result && result.isBirdSong && !!result.commonName;

      // If this is a test run (from master audio or live recording in dev mode), log it to the test collection
      if (testContext) {
          const source = testContext.birdId === 'live-test' ? 'live_recording' : 'master_audio';
          await createTestRun(result, source, testContext);
          setRecordingState('idle');
          router.push(source === 'live_recording' ? '/log/test/live' : '/log/test');
          return;
      }

      // Standard user flow continues here...
      const analysisRunId = await createAnalysisRun(
          base64Audio, 
          result, 
          wasSuccessful, 
          locationData, 
          appSettings.mode, 
          isDeveloperRun,
          recordingLengthSeconds,
          { primaryIdentificationMs: analysisDurationMs }
      );

      if (analysisRunId) {
          setRecordingState('idle');
          if (wasSuccessful) {
            router.push(`/record/confirm/${analysisRunId}`);
          } else {
            // Handle AI not finding a bird for a regular user
            setLastAudio(JSON.stringify([base64Audio, analysisRunId]));
            setRecordingState('confirming');
          }
      } else {
           setRecordingState('idle');
      }

    } catch (error) {
      console.error('Error identifying bird sound:', error);
      const analysisDurationMs = recordingStartTimeRef.current ? Date.now() - recordingStartTimeRef.current : undefined;
      logErrorToFirestore(error as Error, 'ai-identification-failure', {
        sessionId: currentSessionId.current,
        timestamp: currentTimestamp.current,
        locationData: locationData,
        appMode: appSettings.mode,
        userId: user?.uid
      });

      // Handle API failure for dev mode test runs
      if (testContext) {
          const source = testContext.birdId === 'live-test' ? 'live_recording' : 'master_audio';
          await createTestRun({ isBirdSong: false, error: (error as Error).message }, source, testContext);
          setRecordingState('idle');
          router.push(source === 'live_recording' ? '/log/test/live' : '/log/test');
          return;
      }

      // Handle API failure for regular users
       const analysisRunId = await createAnalysisRun(
           base64Audio, 
           { error: (error as Error).message, isBirdSong: false }, 
           false, 
           locationData, 
           appSettings.mode, 
           isDeveloperRun,
           recordingLengthSeconds,
           analysisDurationMs ? { primaryIdentificationMs: analysisDurationMs } : undefined
        );
      if (analysisRunId) {
          setLastAudio(JSON.stringify([base64Audio, analysisRunId]));
          setRecordingState('confirming');
      } else {
          setRecordingState('idle');
      }
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
  const isDisabled = recordingState === 'processing' || recordingState === 'confirming' || !user;


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
