import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { List, Mic, Settings } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="p-4 flex justify-center items-center w-full">
      <nav className="flex justify-around w-full max-w-2xl">
        <Link href="/record" passHref>
          <Button>
            <Mic className="mr-2" />
            Start Identifying
          </Button>
        </Link>
        <Link href="/log" passHref>
          <Button>
            <List className="mr-2" />
            My Log
          </Button>
        </Link>
        <Link href="/settings" passHref>
          <Button>
            <Settings className="mr-2" />
            Settings
          </Button>
        </Link>
      </nav>
    </footer>
  );
}
