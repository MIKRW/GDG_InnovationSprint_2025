"use client";

import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("h-48 w-48 mx-auto text-primary", className)}
      fill="currentColor"
    >
      <path d="M50,10 C45,10 40,12 35,15 C30,18 25,22 22,28 C20,34 20,40 22,46 C24,52 28,58 35,62 C32,65 30,70 30,75 C30,85 40,90 50,90 C60,90 70,85 70,75 C70,70 68,65 65,62 C72,58 76,52 78,46 C80,40 80,34 78,28 C75,22 70,18 65,15 C60,12 55,10 50,10 Z M50,20 C53,20 56,21 58,23 C60,25 62,28 63,31 C64,34 64,37 63,40 C62,43 60,46 58,48 C56,50 53,51 50,51 C47,51 44,50 42,48 C40,46 38,43 37,40 C36,37 36,34 37,31 C38,28 40,25 42,23 C44,21 47,20 50,20 Z" />
    </svg>
  );
}
