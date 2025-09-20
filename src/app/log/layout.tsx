

'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SearchableHeader } from '@/components/layout/SearchableHeader';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import type { SortOption } from '@/lib/types';
import { usePathname } from 'next/navigation';
import React, { useState, useMemo } from 'react';

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
        return 'Developer Test Logs'
    }
    return 'Bird Book';
  }, [pathname]);
  
  const showSearch = !pathname.startsWith('/log/test') && !pathname.startsWith('/log/errors') && !pathname.startsWith('/log/mystery');

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      // Pass props only if the child is our main log page
      if (pathname === '/log') {
        return React.cloneElement(child, { searchQuery, sortOption } as any);
      }
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
          showSearchAndSort={showSearch}
        />
      }
    >
      <main className="flex-1 overflow-y-auto bg-muted p-4 md:p-6">
         {childrenWithProps}
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
