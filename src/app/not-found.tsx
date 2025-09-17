
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <AppLayout header={<SecondaryHeader title="Page Not Found" />}>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          Sorry, the page you are looking for does not exist or may have been moved.
        </p>
        <Link href="/" passHref>
          <Button>Return to Home</Button>
        </Link>
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
