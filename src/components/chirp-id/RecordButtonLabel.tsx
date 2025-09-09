import { cn } from '@/lib/utils';

export default function RecordButtonLabel({ className }: { className?: string }) {
  return (
    <span className={cn("mt-4", className)}>
      Tap to Record
    </span>
  );
}
