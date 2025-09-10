import { ThemePage } from '@/components/pages/ThemePage';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';

export default function Theme() {
  return (
    <AppLayout header={<SecondaryHeader title="Custom Theme" />}>
      <main className="flex-1 overflow-y-auto">
        <ThemePage />
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
