import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { List, Mic, Settings } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="flex justify-center items-center w-full h-full">
      <nav className="flex justify-around items-stretch w-full h-full max-w-2xl gap-4">
        <Link href="/record" passHref className="flex-1">
          <Button className="w-full h-full">
            <Mic className="mr-2" />
            Start Identifying
          </Button>
        </Link>
        <Link href="/log" passHref className="flex-1">
          <Button className="w-full h-full">
            <List className="mr-2" />
            My Log
          </Button>
        </Link>
        <Link href="/settings" passHref className="flex-1">
          <Button className="w-full h-full">
            <Settings />
          </Button>
        </Link>
      </nav>
    </footer>
  );
}
