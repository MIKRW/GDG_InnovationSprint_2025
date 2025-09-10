import { ThemePage } from '@/components/pages/ThemePage';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
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
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
