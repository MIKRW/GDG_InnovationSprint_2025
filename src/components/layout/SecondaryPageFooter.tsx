
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, Settings, Mic } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/record', label: 'Record', icon: Mic },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function SecondaryPageFooter() {
  const pathname = usePathname();

  return (
    <footer className="border-t">
      <nav className="flex justify-around py-4 px-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Button
              variant={pathname === href ? 'secondary' : 'ghost'}
              className="flex flex-col items-center h-auto py-2 px-4 rounded-lg"
            >
              <Icon className="h-8 w-8" strokeWidth={2.5} />
              <span className="text-sm mt-1">{label}</span>
            </Button>
          </Link>
        ))}
      </nav>
    </footer>
  );
}
