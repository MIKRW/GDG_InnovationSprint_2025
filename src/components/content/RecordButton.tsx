
'use-client';

import { useState, useRef, forwardRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { MicrophoneIcon } from './MicrophoneIcon';
import { Loader2, MicOff, Square } from 'lucide-react';

type RecordingState =
  | 'idle'
  | 'denied'
  | 'recording';

interface RecordButtonProps {
    onPermissionDenied?: () => void;
    onStartRecording?: () => void;
    onRecordingComplete: (audioBlob: Blob, duration?: number) => void;
    isProcessing: boolean;
}

const RecordButton = forwardRef<HTMLButtonElement, RecordButtonProps>(({
    onPermissionDenied,
    onStartRecording,
    onRecordingComplete,
    isProcessing
}, ref) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Cleanup interval on component unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const handleStartRecording = async () => {
    onStartRecording?.();
    if (recordingState === 'denied') {
        onPermissionDenied?.();
        return;
    }

    recordingStartTimeRef.current = Date.now();
    setElapsedTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.addEventListener('dataavailable', (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      });

      mediaRecorderRef.current.addEventListener('stop', () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const recordingLengthSeconds = recordingStartTimeRef.current ? parseFloat(((Date.now() - recordingStartTimeRef.current) / 1000).toFixed(2)) : undefined;
          onRecordingComplete(audioBlob, recordingLengthSeconds);
      });

      mediaRecorderRef.current.start();
      setRecordingState('recording');

      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Permission denied or no microphone found:', err);
      setRecordingState('denied');
      onPermissionDenied?.();
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setRecordingState('idle');
    }
  };

  const handleClick = () => {
    if (recordingState === 'recording') {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const getButtonContent = () => {
    if (isProcessing) {
        return {
          icon: <Loader2 className="w-40 h-40 text-background animate-spin" />,
          label: 'Analyzing...',
        };
    }
    switch (recordingState) {
      case 'recording':
        return {
          icon: <Square className="w-40 h-40 text-background" />,
          label: 'Press to Stop',
          timer: `${String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:${String(elapsedTime % 60).padStart(2, '0')}`,
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

  const { icon, label, timer } = getButtonContent();
  const isDisabled = isProcessing;

  return (
      <Button
        ref={ref}
        variant="default"
        size="icon"
        className="w-96 h-[36rem] rounded-full bg-foreground hover:bg-foreground/90 flex flex-col-reverse justify-center items-center gap-8 transition-all duration-300 ease-in-out"
        aria-label="Record Audio"
        onClick={handleClick}
        disabled={isDisabled}
      >
        <div className="text-background text-center text-2xl">
          <p className="text-xl">{label}</p>
          {timer && <p className="text-4xl font-mono mt-2">{timer}</p>}
        </div>
        {icon}
      </Button>
  );
});
RecordButton.displayName = "RecordButton";

export { RecordButton };
