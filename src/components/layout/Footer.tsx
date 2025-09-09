import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="p-4 flex justify-center items-center">
      <nav>
        <Link href="/log" passHref>
          <Button variant="outline">
            <List className="mr-2" />
            My Log
          </Button>
        </Link>
      </nav>
    </footer>
  );
}
