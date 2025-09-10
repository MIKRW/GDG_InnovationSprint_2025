
import { MicrophoneIcon } from './MicrophoneIcon';
import { Button } from '@/components/ui/button';

export function RecordButton() {
  return (
    <Button
      variant="default"
      size="icon"
      className="w-96 h-[36rem] rounded-full bg-foreground hover:bg-foreground/90 flex flex-col-reverse justify-center items-center gap-8"
      aria-label="Start Recording"
    >
      <div className="text-background text-center text-2xl">
        <p className="text-xl">Press to Record</p>
      </div>
      <MicrophoneIcon />
    </Button>
  );
}
