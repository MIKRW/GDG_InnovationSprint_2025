
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout header={<SecondaryHeader title="Developer Tools" />}>
      <main className="flex-1 overflow-y-auto bg-muted">
         {children}
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
