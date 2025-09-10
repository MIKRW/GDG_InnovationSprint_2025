import { MicrophoneIcon } from './MicrophoneIcon';
import { Button } from '@/components/ui/button';

export function RecordButton() {
  return (
    <Button
      variant="default"
      size="icon"
      className="w-40 h-40 rounded-full bg-foreground hover:bg-foreground/90"
      aria-label="Start Recording"
    >
      <MicrophoneIcon />
    </Button>
  );
}
