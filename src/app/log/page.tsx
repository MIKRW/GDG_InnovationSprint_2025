import { LogPage } from '@/components/pages/LogPage';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Log() {
  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <LogPage />
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
