
'use-client';

import { useState, useRef, forwardRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MicOff } from 'lucide-react';
import { ColorableLogo } from './ColorableLogo';

type RecordingState = 'idle' | 'denied';

interface RecordButtonProps {
    onPermissionDenied?: () => void;
    onStart?: () => void;
    onStop?: () => void;
    onRecordingComplete: (audioBlob: Blob, duration?: number) => void;
    isRecording: boolean;
}

const RecordButton = forwardRef<HTMLButtonElement, RecordButtonProps>(({
    onPermissionDenied,
    onStart,
    onStop,
    onRecordingComplete,
    isRecording,
}, ref) => {
  const [permissionState, setPermissionState] = useState<RecordingState>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const startRecording = async () => {
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
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                }
            });

            mediaRecorderRef.current.start();
            setPermissionState('idle'); // Success, ensure not in denied state

            timerIntervalRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Permission denied or no microphone found:', err);
            setPermissionState('denied');
            onPermissionDenied?.();
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            // Stop the tracks to turn off the microphone indicator
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
        setElapsedTime(0);
    };

    if (isRecording) {
        startRecording();
    } else {
        stopRecording();
    }

    return () => {
      // Cleanup function to stop recording if component unmounts
      stopRecording();
    };
  }, [isRecording, onPermissionDenied, onRecordingComplete]);


  const handleClick = () => {
    if (isRecording) {
      onStop?.();
    } else {
      if (permissionState === 'denied') {
          onPermissionDenied?.();
          return;
      }
      onStart?.();
    }
  };

  const getButtonContent = () => {
    if (permissionState === 'denied') {
       return {
        icon: <MicOff className="w-full h-full text-foreground/50" />,
        title: 'Mic Access Denied',
      };
    }
    if (isRecording) {
       return {
        icon: <ColorableLogo className="text-foreground" />,
        title: 'Press to Stop',
        timer: `${String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:${String(elapsedTime % 60).padStart(2, '0')}`,
      };
    }
    return {
      icon: <ColorableLogo className="text-foreground" />,
      title: 'Name that Bird!',
      subtitle: 'Press to record',
    };
  };

  const { icon, title, subtitle, timer } = getButtonContent();

  return (
      <div className="flex flex-col items-center justify-center gap-0 h-full w-full">
        <Button
            ref={ref}
            variant="ghost"
            size="icon"
            className="w-full h-full rounded-full flex flex-col justify-center items-center gap-8 transition-all duration-300 ease-in-out hover:bg-transparent"
            aria-label="Record Audio"
            onClick={handleClick}
        >
            <div className="transition-all duration-300 w-full h-full">
              <div className="w-full h-full p-12 transition-all duration-300">
                  {icon}
              </div>
            </div>
        </Button>
        <p className="text-8xl font-mono font-bold text-foreground text-center -mt-16">
            {title}
        </p>
        {subtitle && <p className="text-3xl font-mono text-foreground/80 text-center">{subtitle}</p>}
        {timer && <p className="text-5xl font-mono mt-2 text-foreground text-center">{timer}</p>}
      </div>
  );
});
RecordButton.displayName = "RecordButton";

export { RecordButton };
