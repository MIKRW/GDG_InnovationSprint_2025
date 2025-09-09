"use client";

import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-48 w-48 mx-auto text-primary", className)}
    >
      <path d="M45 10 C 50 5, 60 5, 65 10 C 75 20, 75 35, 60 45" />
      <path d="M62 43 C 80 55, 85 70, 80 85" />
      <path d="M45 10 C 35 15, 25 30, 30 50 C 35 70, 40 90, 25 95" />
      <path d="M30 50 C 40 55, 55 60, 60 60" />
      <circle cx="59" cy="22" r="1.5" fill="currentColor" stroke="none" />
      <path d="M64 12 C 67 15, 67 18, 64 21" />
    </svg>
  );
}
