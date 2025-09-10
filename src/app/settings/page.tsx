import { SettingsPage } from '@/components/pages/SettingsPage';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';

export default function Settings() {
  return (
    <AppLayout header={<SecondaryHeader title="Settings" />}>
      <main className="flex-1 overflow-y-auto">
        <SettingsPage />
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
