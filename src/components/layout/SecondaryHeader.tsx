import { ContrastButton } from '@/components/content/ContrastButton';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

export function SecondaryHeader({ title }: { title: string }) {
  return (
    <header className="border-b flex items-center justify-between px-4 py-8">
       <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <Home className="h-5 w-5" />
          </Link>
        </Button>
      <h1 className="text-lg font-bold">{title}</h1>
      <ContrastButton />
    </header>
  );
}
