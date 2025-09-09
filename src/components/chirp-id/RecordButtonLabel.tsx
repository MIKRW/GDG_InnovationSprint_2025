import { cn } from '@/lib/utils';

export default function RecordButtonLabel({ className }: { className?: string }) {
  return (
    <span className={cn(className)}>
      Tap to Record
    </span>
  );
}
