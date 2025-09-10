import { ThemePage } from '@/components/pages/ThemePage';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { RowContainer } from '@/components/layout/RowContainer';

export default function Theme() {
  return (
    <AppLayout header={<SecondaryHeader title="Custom Theme" />}>
      <main className="flex-1 overflow-y-auto bg-muted">
        <RowContainer>
          <div className="row-span-2 overflow-y-auto">
            <ThemePage />
          </div>
          <div></div>
        </RowContainer>
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
