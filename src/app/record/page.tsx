import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';

export default function RecordPage() {
  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Ready to Record</h1>
            <p className="text-muted-foreground">Press the button to start</p>
          </div>
          <Button
            variant="default"
            size="icon"
            className="w-40 h-40 rounded-full bg-primary hover:bg-primary/90"
            aria-label="Start Recording"
          >
            <Mic className="w-20 h-20" />
          </Button>
        </div>
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
