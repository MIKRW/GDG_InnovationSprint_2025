import { cn } from '@/lib/utils';

export default function Microphone({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('w-24 h-24', className)}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a8 8 0 0 0 8 8v3h-3v2h8v-2h-3v-3a8 8 0 0 0 8-8v-2Z" />
    </svg>
  );
}
