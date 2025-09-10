import { LogPage } from '@/components/pages/LogPage';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Log() {
  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <LogPage />
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
