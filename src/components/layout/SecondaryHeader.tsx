
import { ContrastButton } from '@/components/content/ContrastButton';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

export function SecondaryHeader({ title }: { title: string }) {
  return (
    <header className="border-b flex items-center justify-between px-4 py-8">
       <Link href="/" asChild>
        <Button variant="ghost" size="icon">
          <Home className="h-5 w-5" />
        </Button>
       </Link>
      <h1 className="text-lg font-bold">{title}</h1>
      <ContrastButton />
    </header>
  );
}
