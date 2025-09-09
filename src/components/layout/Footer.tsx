import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { List, Mic } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="p-4 flex justify-center items-center">
      <nav className="flex gap-4">
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
      </nav>
    </footer>
  );
}
