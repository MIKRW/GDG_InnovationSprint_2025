
'use-client';

import { useState, useRef, forwardRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MicOff } from 'lucide-react';
import { ColorableLogo } from './ColorableLogo';
import WavDecoder from 'wav-decoder';

interface RecordButtonProps {
    onStart?: () => void;
    onStop?: () => void;
    onRecordingComplete: (audioBlob: Blob | null) => void;
    isRecording: boolean;
    hasPermission: boolean | null;
}

// Helper function to encode audio buffer to WAV
const encodeWAV = (samples: Float32Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    floatTo16BitPCM(view, 44, samples);

    return new Blob([view], { type: 'audio/wav' });
};


const RecordButton = forwardRef<HTMLButtonElement, RecordButtonProps>(({
    onStart,
    onStop,
    onRecordingComplete,
    isRecording,
    hasPermission,
}, ref) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const startInternalRecording = async () => {
        setElapsedTime(0);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];

            mediaRecorderRef.current.addEventListener('dataavailable', (event: BlobEvent) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            });

            mediaRecorderRef.current.addEventListener('stop', async () => {
                const audioBlobWebM = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                if (audioBlobWebM.size === 0) {
                    onRecordingComplete(null);
                    return;
                }

                try {
                    // Convert WebM to WAV
                    const arrayBuffer = await audioBlobWebM.arrayBuffer();
                    const audioContext = new AudioContext();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    const wavBlob = encodeWAV(audioBuffer.getChannelData(0), audioBuffer.sampleRate);
                    onRecordingComplete(wavBlob);
                } catch (conversionError) {
                    console.error('Error converting audio to WAV:', conversionError);
                    onRecordingComplete(null); // Pass null if conversion fails
                }

                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                }
                if (mediaRecorderRef.current) {
                    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                }
            });

            mediaRecorderRef.current.start();
            timerIntervalRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);

        } catch (err) {
            console.error('Error starting recording in component:', err);
            onRecordingComplete(null);
        }
    };
    
    const stopInternalRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
        setElapsedTime(0);
    };

    if (isRecording) {
        startInternalRecording();
    } else {
        stopInternalRecording();
    }

    return () => {
      // Cleanup function to stop recording if component unmounts
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording, onRecordingComplete]);


  const handleClick = () => {
    if (isRecording) {
      onStop?.();
    } else {
      onStart?.();
    }
  };

  const getButtonContent = () => {
    if (hasPermission === false) {
       return {
        icon: <MicOff className="w-full h-full text-foreground/50" />,
        title: 'Mic Disabled',
        subtitle: 'Click to grant permission',
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
            className="w-full h-full rounded-full flex flex-col justify-center items-center gap-8 transition-all duration-300 ease-in-out hover:bg-transparent disabled:opacity-50"
            aria-label="Record Audio"
            onClick={handleClick}
            disabled={hasPermission === null} // Only truly disabled while checking permission
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
