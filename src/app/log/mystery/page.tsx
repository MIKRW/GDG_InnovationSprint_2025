
'use client';

import { useState } from 'react';
import { MysteryLogPage } from '@/components/pages/MysteryLogPage';
import type { SortOption } from '@/lib/types';

export default function MysteryLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  return (
      <MysteryLogPage searchQuery={searchQuery} sortOption={sortOption} />
  );
}
