
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SearchableHeader } from '@/components/layout/SearchableHeader';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import type { SortOption } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function LogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const pathname = usePathname();

  let title = 'Bird Book';
  if (pathname.startsWith('/log/mystery')) {
    title = 'Mystery Recordings';
  } else if (pathname.startsWith('/log/test')) {
    title = 'Test Results';
  }

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
        {/* Pass state to children that need it */}
        {children &&
          (children as any).type.name === 'LogPage' &&
          (
            <div className="h-full">
              {(children as React.ReactElement<any, string | React.JSXElementConstructor<any>>).props.children}
            </div>
          )}
        {children &&
          (children as any).type.name !== 'LogPage' &&
          (
            <div className="h-full">
              {children}
            </div>
          )}
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
