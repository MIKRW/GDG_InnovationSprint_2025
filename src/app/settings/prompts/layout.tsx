
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SearchableHeader } from '@/components/layout/SearchableHeader';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';

export default function PromptManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout header={<SearchableHeader title="Prompt Management" showSearchAndSort={false} onSearchChange={() => {}} onSortChange={() => {}} />}>
      <main className="flex-1 overflow-y-auto bg-muted p-4 md:p-6">
         {children}
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
