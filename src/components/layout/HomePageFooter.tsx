
'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Settings, Home, BookImage } from 'lucide-react';
import Link from 'next/link';

interface HomePageFooterProps {
  centerButtonLabel?: string;
  centerButtonHref?: string;
}

export function HomePageFooter({ centerButtonLabel = "Bird Book", centerButtonHref = "/log" }: HomePageFooterProps) {
  const pathname = usePathname();

  return (
    <footer className="border-t">
      <nav className="flex justify-center items-center py-4 px-4 gap-24">
        <Link href="/log">
            <Button variant="ghost" size="icon" className="h-20 w-20">
                <BookImage className="h-16 w-16 text-foreground" />
            </Button>
        </Link>
        <Link href="/settings">
          <Button
            variant='ghost'
            size='icon'
            className="h-20 w-20"
          >
            <Settings className="h-16 w-16 text-foreground" />
          </Button>
        </Link>
      </nav>
    </footer>
  );
}
