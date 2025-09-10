
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import { identifyBirdBySound } from '@/ai/flows/identify-bird-flow';
import { addLog } from '@/lib/local-storage';
import type { BirdLog } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { MicrophoneIcon } from './MicrophoneIcon';
import { Loader2, Mic, MicOff, Square } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type RecordingState =
  | 'idle'
  | 'requesting'
  | 'denied'
  | 'recording'
  | 'processing';

export function RecordButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [recordingState, setRecordingState] =
    useState<RecordingState>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);


  const handleStartRecording = async () => {
    setRecordingState('requesting');
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
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      // Stop all audio tracks to turn off the microphone indicator
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleStop = async () => {
    setRecordingState('processing');
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

    // Convert blob to data URI
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      
      try {
        const result = await identifyBirdBySound({ audioDataUri: base64Audio });
        if (result && result.isBirdSong && result.commonName && result.scientificName && result.description && result.imagePrompt) {
            const newLog: BirdLog = {
                id: uuidv4(),
                timestamp: new Date().toISOString(),
                commonName: result.commonName,
                scientificName: result.scientificName,
                description: result.description,
                imagePrompt: result.imagePrompt
            };
            addLog(newLog);
            router.push(`/log/${newLog.id}`);
        } else {
            toast({
                variant: 'destructive',
                title: 'No Bird Song Identified',
                description: 'The AI could not identify a bird song in the recording. Please try again.',
            });
            setRecordingState('idle');
        }
      } catch (error) {
        console.error('Error identifying bird sound:', error);
        toast({
            variant: 'destructive',
            title: 'Analysis Failed',
            description: 'Something went wrong during the analysis. Please check your connection and try again.',
        });
        setRecordingState('idle');
      }
    };
  };

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
          disabled: false,
        };
      case 'processing':
        return {
          icon: <Loader2 className="w-40 h-40 text-background animate-spin" />,
          label: 'Analyzing...',
          disabled: true,
        };
      case 'denied':
         return {
          icon: <MicOff className="w-40 h-40 text-background" />,
          label: 'Microphone Access Denied',
          disabled: true,
        };
      default: // idle, requesting
        return {
          icon: <MicrophoneIcon />,
          label: 'Press to Record',
          disabled: recordingState === 'requesting',
        };
    }
  };

  const { icon, label, disabled } = getButtonContent();

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="w-96 h-[36rem] rounded-full bg-foreground hover:bg-foreground/90 flex flex-col-reverse justify-center items-center gap-8 transition-all duration-300 ease-in-out"
        aria-label="Record Audio"
        onClick={handleClick}
        disabled={disabled}
      >
        <div className="text-background text-center text-2xl">
          <p className="text-xl">{label}</p>
        </div>
        {icon}
      </Button>
      {recordingState === 'denied' && (
          <Alert variant="destructive" className="mt-8 max-w-md">
            <MicOff className="h-4 w-4" />
            <AlertTitle>Microphone Access Required</AlertTitle>
            <AlertDescription>
                This app needs access to your microphone to identify bird songs. Please enable microphone permissions in your browser settings and refresh the page.
            </AlertDescription>
          </Alert>
      )}
    </>
  );
}
