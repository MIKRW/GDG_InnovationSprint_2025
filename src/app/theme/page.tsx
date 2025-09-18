
import { ThemePage } from '@/components/pages/ThemePage';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';
import { PrimaryHeader } from '@/components/layout/PrimaryHeader';

export default function Theme() {
  return (
    <AppLayout header={<PrimaryHeader />}>
      <main className="flex-1 overflow-y-auto bg-muted">
        <div data-component="ThemeGeneratorContainer" className="h-full">
          <ThemePage />
        </div>
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
