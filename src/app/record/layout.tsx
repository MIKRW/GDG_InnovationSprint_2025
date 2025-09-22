
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';

export default function RecordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <main className="flex-1 flex flex-col items-center justify-center p-4 bg-muted overflow-hidden relative">
         {children}
      </main>
    </AppLayout>
  );
}
