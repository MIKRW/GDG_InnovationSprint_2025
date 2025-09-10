import { RecordButton } from '@/components/content/RecordButton';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';
import { GridContainer } from '@/components/layout/GridContainer';
import { PrimaryHeader } from '@/components/layout/PrimaryHeader';

export default function RecordPage() {
  return (
    <AppLayout header={<PrimaryHeader />}>
      <main className="flex-1 overflow-y-auto">
        <GridContainer>
          <div
            data-component="RecordContainer"
            className="flex flex-col items-center justify-center h-full"
          >
            <RecordButton>
              <p className="text-xl">Press to Record</p>
            </RecordButton>
          </div>
        </GridContainer>
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
