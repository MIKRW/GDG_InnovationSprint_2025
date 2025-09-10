
'use client';

import { useState } from 'react';
import { RecordButton } from '@/components/content/RecordButton';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Bird } from 'lucide-react';

export default function RecordPage() {
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [showIdentificationError, setShowIdentificationError] = useState(false);

  const handleStartRecording = () => {
    setShowPermissionError(false);
    setShowIdentificationError(false);
  }

  return (
    <AppLayout header={<SecondaryHeader title="Microphone" />}>
      <main className="flex-1 flex items-center justify-center p-4 bg-muted relative">
        <div className="relative flex items-center justify-center">
            {/* The RecordButton is the centered element */}
            <RecordButton 
              onPermissionDenied={() => setShowPermissionError(true)} 
              onIdentificationFailed={() => setShowIdentificationError(true)}
              onStartRecording={handleStartRecording}
            />

            {/* The alerts are positioned absolutely relative to the container */}
            <div className="absolute left-full ml-8 w-80">
              {showPermissionError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Microphone Access Required</AlertTitle>
                  <AlertDescription>
                    This app needs access to your microphone. Please enable permissions in your browser settings and refresh the page.
                  </AlertDescription>
                </Alert>
              )}
              {showIdentificationError && (
                <Alert variant="destructive">
                  <Bird className="h-4 w-4" />
                  <AlertTitle>No Bird Identified</AlertTitle>
                  <AlertDescription>
                    The AI could not identify a bird song in the recording. Please try again.
                  </AlertDescription>
                </Alert>
              )}
            </div>
        </div>
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
