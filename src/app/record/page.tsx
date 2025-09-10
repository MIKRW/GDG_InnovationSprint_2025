import { RecordButton } from '@/components/content/RecordButton';
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
          <RecordButton>
            <h1 className="text-3xl font-bold">Ready to Record</h1>
            <p className="text-muted-foreground">Press the button to start</p>
          </RecordButton>
        </div>
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
