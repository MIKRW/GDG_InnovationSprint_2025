"use client";

import { Bird } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <Bird className={cn("h-48 w-48 mx-auto text-primary", className)} />
  );
}
