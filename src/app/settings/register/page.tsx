
'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { RegistrationForm } from '@/components/pages/RegistrationForm';

export default function RegistrationPage() {
  return (
    <AppLayout header={<SecondaryHeader title="Create Account" />}>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <RegistrationForm />
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
