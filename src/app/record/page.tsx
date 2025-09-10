import { RecordButton } from '@/components/content/RecordButton';
import { ReadyToRecord } from '@/components/content/ReadyToRecord';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';

export default function RecordPage() {
  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <div
          data-component="RecordContainer"
          className="flex flex-col items-center justify-center h-full p-4 text-center"
        >
          <ReadyToRecord />
          <RecordButton />
        </div>
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
