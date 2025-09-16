
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SearchableHeader } from '@/components/layout/SearchableHeader';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';

export default function PromptManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout header={<SearchableHeader title="" showSearchAndSort={false} onSearchChange={() => {}} onSortChange={() => {}} />}>
      <main className="flex-1 overflow-y-auto bg-muted p-4 md:p-6">
         {children}
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
