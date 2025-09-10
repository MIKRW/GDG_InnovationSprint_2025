import { SettingsPage } from '@/components/pages/SettingsPage';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Settings() {
  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <SettingsPage />
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
