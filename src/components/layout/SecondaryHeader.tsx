
'use client';

import { ContrastButton } from '@/components/content/ContrastButton';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';

export function SecondaryHeader({ title }: { title: string }) {
  return (
    <header className="border-b flex items-center justify-between px-4 py-8">
       <Link href="/" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
          <Home className="h-10 w-10" strokeWidth={2.5} />
       </Link>
      <h1 className="text-lg font-bold">{title}</h1>
      <ContrastButton />
    </header>
  );
}
