
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mic, Book, Settings } from 'lucide-react';
import { useAuth } from '@/components/auth/use-auth';
import type { MouseEvent } from 'react';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { href: '/record', label: 'Record', icon: Mic },
  { href: '/log', label: 'Log', icon: Book },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function HomePageFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const { ensureUser, loading } = useAuth();
  const { toast } = useToast();

  const handleNavigation = async (e: MouseEvent<HTMLButtonElement>, href: string) => {
    e.preventDefault();
    
    // First, ensure the user is signed in. This will trigger the anonymous
    // sign-in flow if they are not already authenticated.
    const user = await ensureUser();
    
    if (user) {
      // If sign-in is successful, proceed with navigation.
      router.push(href);
    } else {
      // If sign-in fails, we no longer show a toast, as the console will have the error.
      console.error("Navigation prevented: user could not be authenticated.");
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
            disabled={loading}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs mt-1">{label}</span>
          </Button>
        ))}
      </nav>
    </footer>
  );
}
