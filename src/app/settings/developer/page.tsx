
'use client';

import { useState, useRef, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { Library, Loader2, Music, PlusSquare, Upload, FlaskConical, AlertCircle, TestTube2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { db } from '@/lib/firebase';
import type { AppMode, LocationSettings, TestAudioMetadata } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewMasterAudioForm } from '@/components/content/NewMasterAudioForm';
import { useAuth } from '@/components/providers/AuthProvider';
import { logErrorToFirestore } from '@/lib/error-logging';
import { identifyBirdBySound } from '@/ai/flows/contextual-identify-bird-flow';
import { createAnalysisRun } from '@/lib/actions';
import { PageTitle } from '@/components/content/PageTitle';
import { isDevMode } from '@/lib/utils';

const LOCATION_SETTINGS_KEY = 'location-settings';
const APP_MODE_SETTINGS_KEY = 'app-mode-settings';
const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';


export default function DeveloperPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isClient, setIsClient] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isTestAudioDialogOpen, setIsTestAudioDialogOpen] = useState(false);
  const [testAudioLibrary, setTestAudioLibrary] = useState<TestAudioMetadata[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);

  // Refs for managing state across async operations
  const currentSessionId = useRef<string | null>(null);
  const currentTimestamp = useRef<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
              fileName: birdData.commonName,
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
              duration: audio.duration,
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
    if (isTestAudioDialogOpen && isDevMode()) {
      fetchTestAudioLibrary();
    }
  }, [isTestAudioDialogOpen]);
  
  const getAppSettings = (): { mode: AppMode } => {
    const savedSettingsJson = localStorage.getItem(APP_MODE_SETTINGS_KEY);
    const defaultSettings: { mode: AppMode } = { mode: 'newbie' };
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
    testContext?: { birdId: string; testAudioId: string }
  ) => {
      getLocationForAIShot(async (locationData) => {
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
                { primaryIdentificationMs: analysisDurationMs },
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
                { primaryIdentificationMs: analysisDurationMs },
                currentSessionId.current!, currentTimestamp.current!
            );
        } finally {
            if (analysisRunId) {
                router.push(`/record/confirm/${analysisRunId}`);
            }
            setIsProcessing(false);
        }
      });
  };

  const handleSelectTestAudio = async (audio: TestAudioMetadata) => {
    setIsTestAudioDialogOpen(false);
    currentSessionId.current = uuidv4();
    currentTimestamp.current = new Date().toISOString();
    
    const testContext = { birdId: audio.birdId, testAudioId: audio.testAudioId };

    processAudio(audio.storagePath, true, testContext);
  };

  const onNewAudioUploaded = async (metadata: TestAudioMetadata) => {
    await handleSelectTestAudio(metadata);
  }

  if (isClient && !isDevMode()) {
    notFound();
  }

  if (!isClient) {
      return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
        <PageTitle>Developer Tools</PageTitle>
        <p className="text-muted-foreground mb-8 max-w-2xl">A centralized dashboard for all developer-specific actions and diagnostics.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <Card className="bg-hazard-stripes p-1">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TestTube2 /> AI Test Suite</CardTitle>
                        <CardDescription>Run master audio files through the identifier to test AI accuracy and performance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog open={isTestAudioDialogOpen} onOpenChange={setIsTestAudioDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <Upload className="mr-2 h-4 w-4" />
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
                    </CardContent>
                </Card>
            </Card>

            <Card className="bg-hazard-stripes p-1">
                <Link href="/log/test" className="block h-full">
                    <Card className="h-full hover:bg-muted/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FlaskConical /> AI Test Log</CardTitle>
                            <CardDescription>View historical results from running master audio and live recordings through the AI.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-primary underline">View AI Test Log &rarr;</p>
                        </CardContent>
                    </Card>
                </Link>
            </Card>

             <Card className="bg-hazard-stripes p-1">
                <Link href="/log/errors" className="block h-full">
                    <Card className="h-full hover:bg-muted/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><AlertCircle /> Error Log</CardTitle>
                            <CardDescription>View all captured application errors, such as failed AI generations or database writes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-primary underline">View Error Log &rarr;</p>
                        </CardContent>
                    </Card>
                </Link>
            </Card>

        </div>
    </div>
  );
}
