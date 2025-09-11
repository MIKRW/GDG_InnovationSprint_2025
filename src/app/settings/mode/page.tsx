
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { AppModeSettingsForm } from '@/components/pages/AppModeSettingsForm';

export default function AppModeSettingsPage() {
  return (
    <AppLayout header={<SecondaryHeader title="App Mode" />}>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <AppModeSettingsForm />
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
