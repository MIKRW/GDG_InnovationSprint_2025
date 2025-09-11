
'use client';

import { useState } from 'react';
import { LogPage } from '@/components/pages/LogPage';
import type { SortOption } from '@/lib/types';


export default function Log() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  return (
      <LogPage searchQuery={searchQuery} sortOption={sortOption} />
  );
}
