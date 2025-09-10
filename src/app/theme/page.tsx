
import { ThemePage } from '@/components/pages/ThemePage';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { AppLayout } from '@/components/layout/AppLayout';
import { PrimaryHeader } from '@/components/layout/PrimaryHeader';
import { RowContainer } from '@/components/layout/RowContainer';

export default function Theme() {
  return (
    <AppLayout header={<PrimaryHeader />}>
      <main className="flex-1 overflow-y-auto bg-muted">
        <RowContainer>
          <div
            data-component="ThemeGeneratorContainer"
            className="row-span-2"
          >
            <ThemePage />
          </div>
          <div></div>
        </RowContainer>
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
