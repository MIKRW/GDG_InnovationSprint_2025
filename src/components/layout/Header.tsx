"use client";

import Link from 'next/link';
import { Bird, BookOpen } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Bird className="h-6 w-6" />
          <span className="font-bold sm:inline-block font-headline">
            ChirpID
          </span>
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/log"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/log" ? "text-foreground" : "text-foreground/60"
            )}
          >
            My Log
          </Link>
        </nav>
      </div>
    </header>
  );
}
