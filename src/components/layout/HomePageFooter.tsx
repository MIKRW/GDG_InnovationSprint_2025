
'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { SpeakerButton } from '../content/SpeakerButton';
import { ContrastButton } from '../content/ContrastButton';

export function HomePageFooter() {
  const pathname = usePathname();

  return (
    <footer className="border-t">
      <nav className="flex justify-between items-center py-4 px-4">
        <div className="flex gap-4">
            <SpeakerButton />
            <ContrastButton />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 pl-4">
            <Link href="/log/test">
                <Button variant="link" className="text-6xl font-mono font-bold text-foreground/50 hover:no-underline hover:text-foreground/70">
                    Bird Book
                </Button>
            </Link>
        </div>
        <Link href="/settings">
          <Button
            variant={pathname === '/settings' ? 'secondary' : 'ghost'}
            className="flex flex-col items-center h-auto py-2 px-4 rounded-lg"
          >
            <Settings className="h-10 w-10" strokeWidth={2.5} />
            <span className="text-sm mt-1">Settings</span>
          </Button>
        </Link>
      </nav>
    </footer>
  );
}
