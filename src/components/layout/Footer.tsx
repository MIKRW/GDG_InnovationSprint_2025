import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { List, Mic, Settings } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="flex justify-center items-center w-full h-full">
      <nav className="flex justify-evenly items-stretch w-full h-full gap-4">
        <Link href="/record" passHref className="flex-1 flex justify-center items-center">
          <Button className="aspect-square h-full max-w-full">
            <Mic className="h-1/2 w-1/2" />
          </Button>
        </Link>
        <Link href="/log" passHref className="flex-1 flex justify-center items-center">
          <Button className="aspect-square h-full max-w-full text-base md:text-lg">
            <List className="mr-2 h-1/2 w-1/2" />
          </Button>
        </Link>
        <Link href="/settings" passHref className="flex-1 flex justify-center items-center">
          <Button className="aspect-square h-full max-w-full">
            <Settings className="h-1/2 w-1/2" />
          </Button>
        </Link>
      </nav>
    </footer>
  );
}
