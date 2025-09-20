
'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';

const navItems = [
  // The other items can be added here if needed in the future
];

export function HomePageFooter() {
  const pathname = usePathname();

  return (
    <footer className="border-t">
      <nav className="flex justify-between items-center py-4 px-4">
        <div></div>
        <Link href="/log/test">
            <Button variant="link" className="text-6xl font-mono font-bold text-foreground/50 hover:no-underline hover:text-foreground/70">
                Bird Book
            </Button>
        </Link>
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
