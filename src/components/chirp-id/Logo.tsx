import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-48 w-48 mx-auto text-primary", className)}
    >
      <path d="M13.5 8.5A3.5 3.5 0 0 0 7 8.5" />
      <path d="M13.5 8.5L15 4" />
      <path d="M7 8.5L5.5 4" />
      <path d="M12 15.5a2.5 2.5 0 0 0-5 0" />
      <path d="M14.5 15.5a2.5 2.5 0 0 1 5 0" />
      <path d="M12 15.5a4.5 4.5 0 0 0-9 0" />
      <path d="M12 15.5a4.5 4.5 0 0 1 9 0" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
    </svg>
  );
}
