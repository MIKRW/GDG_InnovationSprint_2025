
'use client';

import { useState, useRef } from 'react';
import { RecordButton } from '@/components/content/RecordButton';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Bird, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RecordPage() {
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [showIdentificationError, setShowIdentificationError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordButtonRef = useRef<{ handleFileSelect: (file: File) => void }>(null);

  const handleStartRecording = () => {
    setShowPermissionError(false);
    setShowIdentificationError(false);
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && recordButtonRef.current) {
        recordButtonRef.current.handleFileSelect(file);
    }
  };
  
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  return (
    <AppLayout header={<SecondaryHeader title="Microphone" />}>
      <main className="flex-1 flex items-center justify-center p-4 bg-muted relative">
        <div className="relative flex items-center justify-center gap-8">
            {isDevMode && (
              <div className="absolute right-full mr-16 w-96 space-y-4">
                   <input
                      type="file"
                      ref={fileInputRef}
                      onChange={onFileChange}
                      className="hidden"
                      accept="audio/*"
                  />
                   <Button onClick={handleUploadClick} variant="outline" className="w-full h-24 text-lg">
                      <Upload className="mr-2 h-6 w-6" />
                      Upload Audio File
                  </Button>
              </div>
            )}

            <RecordButton 
              ref={recordButtonRef}
              onPermissionDenied={() => setShowPermissionError(true)} 
              onIdentificationFailed={() => setShowIdentificationError(true)}
              onStartRecording={handleStartRecording}
            />

            <div className="absolute left-full ml-16 w-96 space-y-4">
              {showPermissionError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-2xl">Microphone Access Required</AlertTitle>
                  <AlertDescription className="text-base">
                    This app needs access to your microphone. Please enable permissions in your browser settings and refresh the page.
                  </AlertDescription>
                </Alert>
              )}
               {showIdentificationError && (
                <Alert variant="destructive">
                  <Bird className="h-4 w-4" />
                  <AlertTitle className="text-2xl">Identification Failed</AlertTitle>
                  <AlertDescription className="text-base">
                    The AI could not identify a bird in the recording. You can save it to the "Mystery Recordings" log to review later.
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
