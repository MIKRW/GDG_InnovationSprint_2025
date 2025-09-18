
'use client';

import { LogPage } from '@/components/pages/LogPage';
import type { SortOption } from '@/lib/types';

interface LogProps {
  searchQuery?: string;
  sortOption?: SortOption;
}

export default function Log({ searchQuery = '', sortOption = 'newest' }: LogProps) {
  return (
      <LogPage searchQuery={searchQuery} sortOption={sortOption} />
  );
}
