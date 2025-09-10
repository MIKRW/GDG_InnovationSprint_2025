
import { RecordButton } from '@/components/content/RecordButton';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';

export default function RecordPage() {
  return (
    <AppLayout header={<SecondaryHeader title="Microphone" />}>
      <main className="flex flex-1 items-center justify-center bg-muted p-4">
        <div className="flex flex-col items-center justify-center text-center">
            <RecordButton />
        </div>
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
