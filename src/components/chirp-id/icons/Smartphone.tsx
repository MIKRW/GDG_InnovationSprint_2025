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
        d="M5.25 2.25A2.25 2.25 0 003 4.5v15A2.25 2.25 0 005.25 21.75h13.5A2.25 2.25 0 0021 19.5v-15A2.25 2.25 0 0018.75 2.25H5.25ZM4.5 19.5V4.5a.75.75 0 01.75-.75h13.5a.75.75 0 01.75.75v15a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
