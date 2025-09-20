
'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';

interface HomePageFooterProps {
  centerButtonLabel?: string;
  centerButtonHref?: string;
}

export function HomePageFooter({ centerButtonLabel = "Bird Book", centerButtonHref = "/log/test" }: HomePageFooterProps) {
  const pathname = usePathname();

  return (
    <footer className="border-t">
      <nav className="flex justify-between items-center py-4 px-4">
        {/* Empty div for spacing */}
        <div className="flex gap-4">
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 pl-4">
            <Link href={centerButtonHref}>
                <Button variant="ghost" className="text-6xl font-mono font-bold text-foreground/50 hover:no-underline hover:bg-transparent hover:text-foreground/70">
                    {centerButtonLabel}
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
