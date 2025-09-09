import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { List, Mic, Settings } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="flex justify-center items-center w-full h-full">
      <nav className="flex justify-around items-stretch w-full h-full max-w-2xl gap-4">
        <Link href="/record" passHref className="flex-1">
          <Button className="w-full h-full">
            <Mic className="h-6 w-6 md:h-8 md:w-8" />
          </Button>
        </Link>
        <Link href="/log" passHref className="flex-1">
          <Button className="w-full h-full text-base md:text-lg">
            <List className="mr-2 h-6 w-6 md:h-8 md:w-8" />
            My Log
          </Button>
        </Link>
        <Link href="/settings" passHref className="flex-1">
          <Button className="w-full h-full">
            <Settings className="h-6 w-6 md:h-8 md:w-8" />
          </Button>
        </Link>
      </nav>
    </footer>
  );
}
