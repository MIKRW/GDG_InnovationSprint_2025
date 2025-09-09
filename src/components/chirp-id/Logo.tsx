import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-48 w-48 mx-auto text-primary', className)}
    >
      <path d="M22,6.5H20.55a1,1,0,0,0-1.74-.23l-3.37,5-1.2-5.26a1,1,0,0,0-1.92-.12L9.13,16.48l-2.48-5.32a1,1,0,0,0-1.72-.25L2,11.5v3a1,1,0,0,0,1,1H3a1,1,0,0,0,1-1V13.84l1.3-1.09,2.49,5.33a1,1,0,0,0,1.72.25l3.19-5.5,1.19,5.25a1,1,0,0,0,1.92.12L20.26,8.22l1.24,1.46a1,1,0,0,0,1.5-1.32Z" />
    </svg>
  );
}
