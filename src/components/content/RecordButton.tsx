import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RecordButton() {
  return (
    <Button
      variant="default"
      size="icon"
      className="w-40 h-40 rounded-full bg-primary hover:bg-primary/90"
      aria-label="Start Recording"
    >
      <Mic className="w-20 h-20" />
    </Button>
  );
}
