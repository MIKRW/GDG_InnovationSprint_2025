
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mic, Book, Settings } from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { href: '/record', label: 'Record', icon: Mic },
  { href: '/log', label: 'Log', icon: Book },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function HomePageFooter() {
  const pathname = usePathname();

  return (
    <footer className="border-t">
      <nav className="flex justify-around py-8 px-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Button
            key={href}
            variant={pathname === href ? 'secondary' : 'ghost'}
            size="sm"
            asChild
            className="flex flex-col items-center h-auto"
          >
            <Link href={href}>
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{label}</span>
            </Link>
          </Button>
        ))}
      </nav>
    </footer>
  );
}
