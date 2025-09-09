import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';

export default function Header() {
  return (
    <header className="p-4">
      <nav>
        <Link href="/log" passHref>
          <Button variant="outline">
            <List className="mr-2" />
            My Log
          </Button>
        </Link>
      </nav>
    </header>
  );
}
