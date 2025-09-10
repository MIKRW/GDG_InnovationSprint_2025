
import { MysteryLogPage } from '@/components/pages/MysteryLogPage';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';

export default function MysteryLogs() {
  return (
    <AppLayout header={<SecondaryHeader title="Mystery Recordings" />}>
      <main className="flex-1 overflow-y-auto bg-muted">
        <MysteryLogPage />
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
