import { cn } from '@/lib/utils';

export default function Byline({ className }: { className?: string }) {
  return (
    <p className={cn("text-lg text-muted-foreground mt-2", className)}>
      Your pocket guide to bird songs.
    </p>
  );
}
