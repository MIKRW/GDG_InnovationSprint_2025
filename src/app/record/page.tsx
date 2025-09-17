
'use client';

import { useState, useRef, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

import { RecordButton } from '@/components/content/RecordButton';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Library, Loader2, Music, PlusSquare, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { db, storage } from '@/lib/firebase';
import type { AnalysisRun, AppMode, AppSettings, LocationSettings, TestAudioMetadata } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewMasterAudioForm } from '@/components/content/NewMasterAudioForm';
import { useAuth } from '@/components/providers/AuthProvider';
import { logErrorToFirestore } from '@/lib/error-logging';
import { identifyBirdBySound } from '@/ai/flows/contextual-identify-bird-flow';
import { createAnalysisRun } from '@/lib/actions';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';

const LOCATION_SETTINGS_KEY = 'location-settings';
const APP_MODE_SETTINGS_KEY = 'app-mode-settings';
const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';


export default function RecordPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isTestAudioDialogOpen, setIsTestAudioDialogOpen] = useState(false);
  const [testAudioLibrary, setTestAudioLibrary] = useState<TestAudioMetadata[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  // Refs for managing state across async operations
  const currentSessionId = useRef<string | null>(null);
  const currentTimestamp = useRef<string | null>(null);


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
              birdId: doc.id,
              testAudioId: audio.audioId,
              genus: birdData.genus,
              species: birdData.species,
              scientificName: birdData.scientificName,
              family: birdData.family,
              order: birdData.order,
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

  useEffect(() => {
    if (isTestAudioDialogOpen && isDevMode) {
      fetchTestAudioLibrary();
    }
  }, [isTestAudioDialogOpen, isDevMode]);
  
  const getAppSettings = (): AppSettings => {
    const savedSettingsJson = localStorage.getItem(APP_MODE_SETTINGS_KEY);
    const defaultSettings: AppSettings = { mode: 'newbie' };
    if (savedSettingsJson) {
        try {
            const parsed = JSON.parse(savedSettingsJson);
            if (parsed.mode === 'newbie' || parsed.mode === 'twitcher') {
                return { mode: parsed.mode };
            }
        } catch { return defaultSettings; }
    }
    return defaultSettings;
  }

  const getLocationForAIShot = (
    callback: (locationData?: { latitude?: number; longitude?: number, locationDescription?: string }) => void
  ) => {
    const savedSettingsJson = localStorage.getItem(LOCATION_SETTINGS_KEY);
    let settings: LocationSettings = { mode: 'device', manual: { latitude: 0, longitude: 0 }, description: '', privacy: { isOutside: true } };
    if (savedSettingsJson) {
      try { settings = JSON.parse(savedSettingsJson); } catch { /* Fallback to default */ }
    }

    if (settings.mode === 'device') {
      navigator.geolocation.getCurrentPosition(
        (position) => callback({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => callback() // Proceed without location on error/denial
      );
    } else if (settings.mode === 'manual') {
      callback(settings.manual);
    } else if (settings.mode === 'description') {
      callback({ locationDescription: settings.description });
    } else { // privacy mode
      callback();
    }
  };

  const processAudio = (
    storagePath: string,
    isDeveloperRun: boolean,
    testContext?: { birdId: string, testAudioId: string },
    recordingLengthSeconds?: number
  ) => {
      const processWithLocation = async (locationData?: { latitude?: number; longitude?: number, locationDescription?: string }) => {
        setIsProcessing(true);
        if (!currentTimestamp.current || !user) {
            setIsProcessing(false);
            return;
        }
        const appSettings = getAppSettings();
        const hardware = localStorage.getItem(HARDWARE_SETTINGS_KEY);
        let analysisRunId: string | null = null;
        const analysisStartTime = Date.now();

        try {
            const result = await identifyBirdBySound({
                audioStoragePath: storagePath,
                timestamp: currentTimestamp.current,
                mode: appSettings.mode,
                ...locationData
            });
            const analysisDurationMs = Date.now() - analysisStartTime;
            const wasSuccessful = result && result.isBirdSong && !!result.commonName;

            analysisRunId = await createAnalysisRun(
                user.uid, storagePath, result, wasSuccessful, locationData, hardware,
                appSettings.mode, isDeveloperRun, testContext,
                recordingLengthSeconds, { primaryIdentificationMs: analysisDurationMs },
                currentSessionId.current!, currentTimestamp.current!
            );

        } catch (error) {
            const analysisDurationMs = Date.now() - analysisStartTime;
            logErrorToFirestore(error as Error, 'ai-identification-failure', {
                sessionId: currentSessionId.current, timestamp: currentTimestamp.current,
                locationData: locationData, appMode: appSettings.mode, userId: user?.uid
            });
            
            analysisRunId = await createAnalysisRun(
                user.uid, storagePath, { error: (error as Error).message, isBirdSong: false }, false,
                locationData, hardware, appSettings.mode, isDeveloperRun, testContext,
                recordingLengthSeconds, { primaryIdentificationMs: analysisDurationMs },
                currentSessionId.current!, currentTimestamp.current!
            );
        } finally {
            if (analysisRunId) {
                router.push(`/record/confirm/${analysisRunId}`);
            }
            setIsProcessing(false);
        }
      };

      getLocationForAIShot(processWithLocation);
  };
  
  const handleStartRecording = () => {
    setShowPermissionError(false);
    currentSessionId.current = uuidv4();
    currentTimestamp.current = new Date().toISOString();
  }

  const handleRecordingComplete = async (audioBlob: Blob, duration?: number) => {
    if (!user) return;
    setIsProcessing(true);

    const isDevTest = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    const testContext = isDevTest ? { birdId: 'live-test', testAudioId: uuidv4() } : undefined;

    // 1. Upload the blob to Firebase Storage
    const recordingId = uuidv4();
    const filePath = `users/${user.uid}/recordings/${recordingId}.webm`;
    const fileRef = storageRef(storage, filePath);

    try {
        await uploadBytes(fileRef, audioBlob);
        
        // 2. Once uploaded, call processAudio with the storage path
        processAudio(filePath, isDevTest, testContext, duration);

    } catch (error) {
        console.error("Failed to upload live recording:", error);
        logErrorToFirestore(error as Error, 'live-audio-upload-failure', {
            userId: user.uid,
            filePath: filePath,
        });
        setIsProcessing(false);
    }
  }

  const handleSelectTestAudio = async (audio: TestAudioMetadata) => {
    setIsTestAudioDialogOpen(false);
    currentSessionId.current = uuidv4();
    currentTimestamp.current = new Date().toISOString();
    
    const testContext = { birdId: audio.birdId, testAudioId: audio.testAudioId };

    processAudio(audio.storagePath, true, testContext, undefined);
  };

  const onNewAudioUploaded = async (metadata: TestAudioMetadata) => {
    await handleSelectTestAudio(metadata);
  }

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
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                              <DialogTitle>Run Master Audio Test</DialogTitle>
                              <DialogDescription>
                                  Choose a master audio file from the library or upload a new one to run through the AI identifier.
                              </DialogDescription>
                          </DialogHeader>
                          <Tabs defaultValue="from-library">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="from-library"><Library className="mr-2 h-4 w-4"/> From Library</TabsTrigger>
                                <TabsTrigger value="upload-new"><PlusSquare className="mr-2 h-4 w-4"/> Upload New</TabsTrigger>
                            </TabsList>
                            <TabsContent value="from-library">
                                <div className="space-y-2 py-4 h-96 overflow-y-auto">
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
                            </TabsContent>
                             <TabsContent value="upload-new">
                                <div className="py-4">
                                   <NewMasterAudioForm onUploadSuccess={onNewAudioUploaded} />
                                </div>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </Card>
              </div>
            )}

            <RecordButton 
              onPermissionDenied={() => setShowPermissionError(true)} 
              onStartRecording={handleStartRecording}
              onRecordingComplete={handleRecordingComplete}
              isProcessing={isProcessing}
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
            </div>
        </div>
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
