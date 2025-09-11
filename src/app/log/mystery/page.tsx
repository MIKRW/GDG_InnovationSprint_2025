
'use client';

import { MysteryLogPage } from '@/components/pages/MysteryLogPage';
import type { SortOption } from '@/lib/types';

interface MysteryLogsProps {
    searchQuery?: string;
    sortOption?: SortOption;
}

export default function MysteryLogs({ searchQuery = '', sortOption = 'newest' }: MysteryLogsProps) {
  return (
      <MysteryLogPage searchQuery={searchQuery} sortOption={sortOption} />
  );
}
