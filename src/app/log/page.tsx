
'use client';

import { useState } from 'react';
import { LogPage } from '@/components/pages/LogPage';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { AppLayout } from '@/components/layout/AppLayout';
import { SearchableHeader } from '@/components/layout/SearchableHeader';
import type { SortOption } from '@/lib/types';


export default function Log() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  return (
    <AppLayout
      header={
        <SearchableHeader
          title="Bird Book"
          onSearchChange={setSearchQuery}
          onSortChange={setSortOption}
        />
      }
    >
      <main className="flex-1 overflow-y-auto bg-muted">
        <LogPage searchQuery={searchQuery} sortOption={sortOption} />
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
