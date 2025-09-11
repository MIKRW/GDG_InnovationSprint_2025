
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { PageTitle } from '@/components/content/PageTitle';
import { Card } from '@/components/ui/card';

export default function TestLogPage() {

  // In the future, this page will fetch and display results from docs/test-log.json
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  if (!isDevMode) {
    return (
        <AppLayout header={<SecondaryHeader title="Not Found" />}>
            <main className="flex-1 p-4 text-center">
                <p>This page is not available.</p>
            </main>
            <SecondaryPageFooterV2 />
        </AppLayout>
    )
  }

  return (
    <AppLayout header={<SecondaryHeader title="Test Results" />}>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <PageTitle>Test Run History</PageTitle>
        <p className="text-muted-foreground mb-6">
          This log contains the results of running master audio files through the AI identifier.
        </p>
        <div className="space-y-4">
            <Card className="p-4">
                <p className="text-muted-foreground">No test results have been logged yet. Upload a test audio file on the Record page to begin.</p>
            </Card>
        </div>
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
