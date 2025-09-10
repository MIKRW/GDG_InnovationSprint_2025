import { SettingsPage } from '@/components/pages/SettingsPage';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Settings() {
  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <SettingsPage />
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
