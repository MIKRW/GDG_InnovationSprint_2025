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
      className={cn("h-24 w-24 mx-auto text-primary", className)}
    >
      <path d="M16 3.01s-2.3 2.1-5.9 4.9c-2.3 1.8-4.2 3.8-5.7 5.3-2.6 2.6-2.5 6.8.3 9.4s6.8 2.8 9.4.3c1.5-1.5 3.5-3.4 5.3-5.7 2.8-3.6 4.9-5.9 4.9-5.9s-1-2.2-2.9-4.1c-2-2-4.1-2.9-4.1-2.9" />
      <path d="M12 12a3 3 0 1 0-4.2-4.2" />
    </svg>
  );
}
