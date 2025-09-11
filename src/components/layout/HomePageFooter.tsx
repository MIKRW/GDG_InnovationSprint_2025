
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mic, Book, Settings } from 'lucide-react';
import { useAuth } from '@/components/auth/use-auth';
import type { MouseEvent } from 'react';

const navItems = [
  { href: '/record', label: 'Record', icon: Mic },
  { href: '/log', label: 'Log', icon: Book },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function HomePageFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const { ensureUser } = useAuth();

  const handleNavigation = async (e: MouseEvent<HTMLButtonElement>, href: string) => {
    e.preventDefault();
    const user = await ensureUser();
    if (user) {
      router.push(href);
    } else {
      // Handle the case where sign-in fails, perhaps show a toast
      console.error("Could not navigate, user not signed in.");
    }
  };

  return (
    <footer className="border-t">
      <nav className="flex justify-around py-8 px-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Button
            key={href}
            variant={pathname === href ? 'secondary' : 'ghost'}
            size="sm"
            onClick={(e) => handleNavigation(e, href)}
            className="flex flex-col items-center h-auto"
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs mt-1">{label}</span>
          </Button>
        ))}
      </nav>
    </footer>
  );
}
