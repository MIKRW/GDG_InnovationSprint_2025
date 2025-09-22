
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { RecordButton } from '@/components/content/RecordButton';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BookImage, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';
import { useSpeaker } from '@/hooks/use-speaker';

const PAGE_NARRATION = "/audio/narration/narration-main-page.wav"; // Placeholder, can be updated
const FIRST_INTERACTION_KEY = 'user-has-interacted';

export default function RecordPage() {
  const [isClient, setIsClient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { playNarration, ...speakerProps } = useSpeaker(PAGE_NARRATION, 'general');

  useEffect(() => {
    setIsClient(true);
    
    // Check initial permission status without prompting
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
        setHasPermission(permissionStatus.state === 'granted');
        permissionStatus.onchange = () => {
            setHasPermission(permissionStatus.state === 'granted');
        };
    });
  }, []);

  const handleStop = () => {
    setIsRecording(false);
    console.log("Recording stopped.");
  };
  
  const handleRecordingComplete = (audioBlob: Blob | null) => {
    setIsRecording(false);
    if (audioBlob) {
        console.log("Recording complete. Blob size:", audioBlob.size);
        toast({
            title: "Recording Complete",
            description: "Ready to implement analysis logic.",
        });
    } else {
        toast({
            variant: 'destructive',
            title: "Recording Failed",
            description: "No audio was recorded.",
        });
    }
  };

 const handleStart = async () => {
    // This is a meaningful interaction.
    if (!sessionStorage.getItem(FIRST_INTERACTION_KEY)) {
        sessionStorage.setItem(FIRST_INTERACTION_KEY, 'true');
        playNarration();
    }

    if (hasPermission === false) {
      try {
        // Request permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone permission denied by user.", err);
        toast({
          variant: 'destructive',
          title: 'Microphone Required',
          description: 'You must grant microphone access to record audio.',
        });
        setIsRecording(false);
      }
    } else {
      // Permission is already granted
      setIsRecording(true);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <AppLayout>
      <main className="flex flex-1 flex-col items-center justify-center bg-muted p-4 relative">
        <div className="absolute top-4 left-4 opacity-50">
            <SpeakerButton onClick={() => playNarration()} {...speakerProps} />
        </div>
        <div className="absolute top-4 right-4 opacity-50">
            <ContrastButton />
        </div>

        <div className="w-[60rem] h-[40rem] flex flex-col items-center justify-center">
            <RecordButton
                onStart={handleStart}
                onStop={handleStop}
                onRecordingComplete={handleRecordingComplete}
                isRecording={isRecording}
                hasPermission={hasPermission}
            />
        </div>
        
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
