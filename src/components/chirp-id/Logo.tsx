"use client";

import { cn } from '@/lib/utils';
import { Bird } from 'lucide-react';

export default function Logo({ className }: { className?: string }) {
  return (
    <Bird className={cn("h-48 w-48 mx-auto text-primary", className)} strokeWidth={1.5} />
  );
}
