
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, Book, Settings, Mic } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/record', label: 'Record', icon: Mic },
  { href: '/log', label: 'Log', icon: Book },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function SecondaryPageFooter() {
  const pathname = usePathname();

  return (
    <footer className="border-t">
      <nav className="flex justify-around py-8 px-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Button
              variant={pathname === href ? 'secondary' : 'ghost'}
              size="sm"
              className="flex flex-col items-center h-auto"
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{label}</span>
            </Button>
          </Link>
        ))}
      </nav>
    </footer>
  );
}
