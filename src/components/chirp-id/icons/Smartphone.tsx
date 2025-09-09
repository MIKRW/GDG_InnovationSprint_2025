import { cn } from '@/lib/utils';

export default function Smartphone({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('w-6 h-6', className)}
    >
      <path
        fillRule="evenodd"
        d="M6.75 2.25A.75.75 0 0 1 7.5 3v18a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm4.5 0a.75.75 0 0 1 .75.75v18a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm3.75.75a.75.75 0 0 0-1.5 0v18a.75.75 0 0 0 1.5 0V3Z"
        clipRule="evenodd"
      />
      <path
        fillRule="evenodd"
        d="M5.25 2.25A2.25 2.25 0 0 0 3 4.5v15A2.25 2.25 0 0 0 5.25 21.75h13.5A2.25 2.25 0 0 0 21 19.5v-15A2.25 2.25 0 0 0 18.75 2.25H5.25ZM4.5 19.5V4.5a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 .75.75v15a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
