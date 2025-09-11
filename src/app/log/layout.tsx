
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SearchableHeader } from '@/components/layout/SearchableHeader';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import type { SortOption } from '@/lib/types';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useMemo } from 'react';

// This is a client component that wraps the Log pages and provides
// the search and sort state to them.
export default function LogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const pathname = usePathname();

  const title = useMemo(() => {
    if (pathname.startsWith('/log/mystery')) {
      return 'Mystery Recordings';
    }
    if (pathname.startsWith('/log/test')) {
        return 'Test Results'
    }
    return 'Bird Book';
  }, [pathname]);

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { searchQuery, sortOption } as any);
    }
    return child;
  });

  return (
    <AppLayout
      header={
        <SearchableHeader
          title={title}
          onSearchChange={setSearchQuery}
          onSortChange={setSortOption}
        />
      }
    >
      <main className="flex-1 overflow-y-auto bg-muted">
         {childrenWithProps}
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
