import { ReactNode } from 'react';
import { MicrophoneIcon } from './MicrophoneIcon';
import { Button } from '@/components/ui/button';

export function RecordButton({ children }: { children: ReactNode }) {
  return (
    <Button
      variant="default"
      size="icon"
      className="w-48 h-72 rounded-full bg-foreground hover:bg-foreground/90 flex flex-col-reverse justify-center items-center gap-4"
      aria-label="Start Recording"
    >
      <div className="text-background text-center">
        {children}
      </div>
      <MicrophoneIcon />
    </Button>
  );
}
