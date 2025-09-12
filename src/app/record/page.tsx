
'use client';

import { useState, useRef, useEffect } from 'react';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import { collection, getDocs } from 'firebase/firestore';
import { RecordButton } from '@/components/content/RecordButton';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Bird, Music, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { db, storage } from '@/lib/firebase';
import type { TestAudioMetadata } from '@/lib/types';


export default function RecordPage() {
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [showIdentificationError, setShowIdentificationError] = useState(false);
  const recordButtonRef = useRef<{ handleFileSelect: (file: File) => void }>(null);
  const [isTestAudioDialogOpen, setIsTestAudioDialogOpen] = useState(false);
  const [testAudioLibrary, setTestAudioLibrary] = useState<TestAudioMetadata[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    if (isTestAudioDialogOpen && isDevMode) {
      const fetchTestAudioLibrary = async () => {
        setIsLibraryLoading(true);
        try {
          const birdsCollectionRef = collection(db, 'birds');
          const querySnapshot = await getDocs(birdsCollectionRef);
          const library: TestAudioMetadata[] = [];
          querySnapshot.forEach((doc) => {
            const birdData = doc.data();
            if (birdData.masterAudioFiles && Array.isArray(birdData.masterAudioFiles)) {
                birdData.masterAudioFiles.forEach((audio: any) => {
                    library.push({
                        id: audio.audioId,
                        fileName: audio.storagePath.split('/').pop() || 'Unknown Filename',
                        storagePath: audio.storagePath,
                        description: audio.description,
                        sourceUrl: audio.sourceUrl || '',
                        author: audio.author || '',
                        license: audio.license || '',
                        hardware: audio.hardware || '',
                        location: audio.location || '',
                    });
                });
            }
          });
          setTestAudioLibrary(library);
        } catch (error) {
          console.error("Error fetching test audio library from Firestore:", error);
        }
        setIsLibraryLoading(false);
      };

      fetchTestAudioLibrary();
    }
  }, [isTestAudioDialogOpen, isDevMode]);

  const handleSelectTestAudio = async (audio: TestAudioMetadata) => {
    try {
        const fileRef = storageRef(storage, audio.storagePath);
        const downloadUrl = await getDownloadURL(fileRef);
        const response = await fetch(downloadUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch test audio: ${response.statusText}`);
        }
        const blob = await response.blob();
        const file = new File([blob], audio.fileName, { type: blob.type || 'audio/wav' });

        if (recordButtonRef.current) {
            recordButtonRef.current.handleFileSelect(file);
        }
        setIsTestAudioDialogOpen(false);
    } catch (error) {
        console.error("Error loading test audio from Firebase Storage:", error);
    }
  };

  return (
    <AppLayout header={<SecondaryHeader title="Microphone" />}>
      <main className="flex-1 flex items-center justify-center p-4 bg-muted relative">
        <div className="relative flex items-center justify-center">
            {isDevMode && (
              <div className="absolute right-full mr-16 w-96 space-y-4">
                  <Card className="bg-hazard-stripes p-2 rounded-lg">
                    <div className="bg-background rounded-sm">
                      <Dialog open={isTestAudioDialogOpen} onOpenChange={setIsTestAudioDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-24 text-lg">
                                <Upload className="mr-2 h-6 w-6" />
                                Run Test Audio
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Select Master Audio File</DialogTitle>
                                <DialogDescription>
                                    Choose a master audio file from the library to run through the AI identifier. This list is fetched from your Firestore database.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 py-4">
                                {isLibraryLoading ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    </div>
                                ) : testAudioLibrary.length === 0 ? (
                                    <p className="text-center text-muted-foreground p-4">No master audio files found in the 'birds' collection in Firestore.</p>
                                ) : (
                                    testAudioLibrary.map((audio) => (
                                        <Button 
                                            key={audio.id} 
                                            variant="ghost" 
                                            className="w-full justify-start h-auto text-left"
                                            onClick={() => handleSelectTestAudio(audio)}
                                        >
                                        <Music className="mr-4 h-6 w-6 shrink-0" />
                                        <div>
                                                <p className="font-semibold">{audio.fileName}</p>
                                                <p className="text-xs text-muted-foreground">{audio.description}</p>
                                        </div>
                                        </Button>
                                    ))
                                )}
                            </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </Card>
              </div>
            )}

            <RecordButton 
              ref={recordButtonRef}
              onPermissionDenied={() => setShowPermissionError(true)} 
              onIdentificationFailed={() => setShowIdentificationError(true)}
              onStartRecording={() => {
                setShowPermissionError(false);
                setShowIdentificationError(false);
              }}
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
