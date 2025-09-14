
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { usePathname } from 'next/navigation';
import React, { useMemo } from 'react';

export default function PromptManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const title = useMemo(() => {
    if (pathname.includes('bird-identifier')) {
      return 'Bird Identifier Prompts';
    }
    if (pathname.includes('theme-generator')) {
      return 'Theme Generation Prompts';
    }
    if (pathname.includes('image-generator')) {
      return 'Image Generation Prompts';
    }
    if (pathname.includes('weather')) {
        return 'Weather Analysis Prompts';
    }
    return 'Prompt Management';
  }, [pathname]);

  return (
    <AppLayout header={<SecondaryHeader title={title} />}>
      <main className="flex-1 overflow-y-auto bg-muted">
         {children}
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
