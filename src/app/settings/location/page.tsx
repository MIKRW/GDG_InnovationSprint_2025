
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { LocationSettingsForm } from '@/components/pages/LocationSettingsForm';

export default function LocationSettingsPage() {
  return (
    <AppLayout header={<SecondaryHeader title="Location Settings" />}>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <LocationSettingsForm />
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
