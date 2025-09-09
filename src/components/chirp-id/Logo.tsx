import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-48 w-48 mx-auto text-primary', className)}
    >
      <path d="M12.001 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.386 2.25 12.001 2.25ZM12 4.125a.875.875 0 0 1 .875.875v5.875c0 .483-.392.875-.875.875s-.875-.392-.875-.875V5a.875.875 0 0 1 .875-.875ZM12 15a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
    </svg>
  );
}
