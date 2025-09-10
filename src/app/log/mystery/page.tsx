
'use client';

import { useState } from 'react';
import { MysteryLogPage } from '@/components/pages/MysteryLogPage';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { AppLayout } from '@/components/layout/AppLayout';
import { SearchableHeader } from '@/components/layout/SearchableHeader';
import type { SortOption } from '@/lib/types';

export default function MysteryLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  return (
    <AppLayout
      header={
        <SearchableHeader
          title="Mystery Recordings"
          onSearchChange={setSearchQuery}
          onSortChange={setSortOption}
        />
      }
    >
      <main className="flex-1 overflow-y-auto bg-muted">
        <MysteryLogPage searchQuery={searchQuery} sortOption={sortOption} />
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
