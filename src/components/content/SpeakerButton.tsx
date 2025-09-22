
'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Speaker, VolumeX } from 'lucide-react';

interface SpeakerButtonProps {
    onClick?: () => void;
    isSpeakerOn?: boolean;
    isPlaying?: boolean;
    isLoading?: boolean;
}

export function SpeakerButton({ onClick, isSpeakerOn, isPlaying, isLoading }: SpeakerButtonProps) {
    
    const Icon = () => {
        if (!isSpeakerOn) return <VolumeX className="h-32 w-32" strokeWidth={2.5} />;
        return <Speaker className={cn("h-32 w-32", isPlaying && "animate-color-cycle")} strokeWidth={2.5} />;
    }

  return (
    <Button 
        variant="ghost" 
        size="icon" 
        aria-label="Toggle Sound" 
        onClick={onClick}
        className={cn("h-40 w-40", isLoading && "animate-pulse")}
        disabled={isLoading}
    >
      <Icon />
    </Button>
  );
}
