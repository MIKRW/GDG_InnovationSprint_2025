
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { LocationSettingsForm } from '@/components/pages/LocationSettingsForm';

export default function LocationSettingsPage() {
  return (
    <AppLayout header={<SecondaryHeader title="Location Settings" />}>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <LocationSettingsForm />
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
