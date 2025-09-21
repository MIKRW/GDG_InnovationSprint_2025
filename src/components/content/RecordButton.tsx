'use-client';

import { useState, useRef, forwardRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MicOff } from 'lucide-react';
import { ColorableLogo } from './ColorableLogo';

interface RecordButtonProps {
    onStart?: () => void;
    onStop?: () => void;
    onRecordingComplete: (audioBlob: Blob | null) => void;
    isRecording: boolean;
    hasPermission: boolean | null;
}

// Helper function to encode raw PCM audio data into a WAV blob
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
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // sampleRate * numChannels * bitsPerSample/8
    view.setUint16(32, 2, true); // numChannels * bitsPerSample/8
    view.setUint16(34, 16, true); // 16 bits per sample
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
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rawAudioBufferRef = useRef<Float32Array[]>([]);
  
  // Use a ref for the recording state to be accessed in the audio processor
  const isRecordingRef = useRef(isRecording);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const stopRecordingAndProcess = useCallback(() => {
    if (scriptProcessorNodeRef.current) {
        scriptProcessorNodeRef.current.disconnect();
        scriptProcessorNodeRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }
     if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }

    if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
    }
    setElapsedTime(0);

    if (rawAudioBufferRef.current.length === 0) {
        onRecordingComplete(null);
        return;
    }

    const totalSamples = rawAudioBufferRef.current.reduce((acc, buf) => acc + buf.length, 0);
    const concatenatedBuffer = new Float32Array(totalSamples);
    let offset = 0;
    for (const buffer of rawAudioBufferRef.current) {
        concatenatedBuffer.set(buffer, offset);
        offset += buffer.length;
    }

    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const wavBlob = encodeWAV(concatenatedBuffer, sampleRate);
    onRecordingComplete(wavBlob);

    rawAudioBufferRef.current = [];

  }, [onRecordingComplete]);

  useEffect(() => {
    if (isRecording) {
        const startRawRecording = async () => {
            setElapsedTime(0);
            rawAudioBufferRef.current = [];

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                audioContextRef.current = context;

                const source = context.createMediaStreamSource(stream);
                mediaStreamSourceRef.current = source;

                const node = context.createScriptProcessor(4096, 1, 1);
                scriptProcessorNodeRef.current = node;

                node.onaudioprocess = (audioProcessingEvent) => {
                    // Use the ref here instead of the state variable
                    if (!isRecordingRef.current) return;
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    rawAudioBufferRef.current.push(new Float32Array(inputData));
                };

                source.connect(node);
                node.connect(context.destination);

                timerIntervalRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
            } catch (err) {
                console.error('Error starting raw audio recording:', err);
                onRecordingComplete(null);
            }
        };
        startRawRecording();

    } else {
        stopRecordingAndProcess();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  useEffect(() => {
    return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        stopRecordingAndProcess();
    };
  }, [stopRecordingAndProcess]);

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
            disabled={hasPermission === null}
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
