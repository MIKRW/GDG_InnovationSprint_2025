
'use client';

import { useState } from 'react';
import { RecordButton } from '@/components/content/RecordButton';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function RecordPage() {
  const [showPermissionError, setShowPermissionError] = useState(false);

  return (
    <AppLayout header={<SecondaryHeader title="Microphone" />}>
      <main className="flex flex-1 items-center justify-center bg-muted p-4">
        <div className="flex items-center justify-center gap-8">
          <RecordButton onPermissionDenied={() => setShowPermissionError(true)} />
          {showPermissionError && (
            <Alert variant="destructive" className="w-80">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Microphone Access Required</AlertTitle>
              <AlertDescription>
                This app needs access to your microphone. Please enable permissions in your browser settings and refresh the page.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
