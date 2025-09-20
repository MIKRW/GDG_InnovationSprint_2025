
'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function HomePageFooter() {
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
              <Icon className="h-10 w-10" strokeWidth={2.5} />
              <span className="text-sm mt-1">{label}</span>
            </Button>
          </Link>
        ))}
      </nav>
    </footer>
  );
}
