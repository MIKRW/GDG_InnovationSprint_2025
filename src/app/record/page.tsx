"use client";

import { useState, useRef, useEffect, type FC } from 'react';
import Image from 'next/image';
import { Loader, AudioLines } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Bird as BirdType } from '@/lib/types';
import { getBirdAnalysis } from '@/lib/actions';
import { useBirdLog } from '@/hooks/use-bird-log';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Microphone from '@/components/chirp-id/Microphone';
import Check from '@/components/chirp-id/icons/Check';
import XMark from '@/components/chirp-id/icons/XMark';
import Search from '@/components/chirp-id/icons/Search';
import RecordButtonLabel from '@/components/chirp-id/RecordButtonLabel';

type UIState = 'idle' | 'recording' | 'preview' | 'loading' | 'results' | 'location_prompt' | 'error';

export default function RecordPage() {
  const [uiState, setUiState] = useState<UIState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [results, setResults] = useState<BirdType[]>([]);
  const [mainSuggestion, setMainSuggestion] = useState<BirdType | null>(null);
  const [otherSuggestions, setOtherSuggestions] = useState<BirdType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showOtherSuggestions, setShowOtherSuggestions] = useState(false);
  const [manualEnvInput, setManualEnvInput] = useState('');

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();
  const { addBirdToLog } = useBirdLog();

  const cleanupStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
  };
  
  useEffect(() => {
    return cleanupStreams;
  }, []);

  const resetState = () => {
    cleanupStreams();
    setUiState('idle');
    setAudioBlob(null);
    if(audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setResults([]);
    setMainSuggestion(null);
    setOtherSuggestions([]);
    setError(null);
    setShowOtherSuggestions(false);
    audioChunksRef.current = [];
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      recorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorderRef.current.ondataavailable = event => {
        audioChunksRef.current.push(event.data);
      };

      recorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setUiState('preview');
        cleanupStreams();
      };

      recorderRef.current.start();
      setUiState('recording');
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not start recording. Please ensure microphone permissions are granted.');
      setUiState('error');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  };
  
  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAnalyze = async (manualInput?: string) => {
    if (!audioBlob) return;
    setUiState('loading');
    
    try {
      const audioDataUri = await blobToDataURL(audioBlob);
      const input = { audioDataUri, manualInput };

      if (!manualInput) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          Object.assign(input, { 
            location: { 
              latitude: position.coords.latitude,
              longitude: position.coords.longitude 
            }
          });
        } catch (locationError) {
          console.warn('Could not get location:', locationError);
          setUiState('location_prompt');
          return;
        }
      }

      const analysisResults = await getBirdAnalysis(input);

      if (analysisResults.error) {
        throw new Error(analysisResults.error);
      }
      
      if (!analysisResults.birds || analysisResults.birds.length === 0) {
        throw new Error("Could not identify any birds. Please try a different audio clip.");
      }

      setResults(analysisResults.birds);
      setMainSuggestion(analysisResults.birds[0]);
      setOtherSuggestions(analysisResults.birds.slice(1));
      setUiState('results');
    } catch (err) {
      console.error('Analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
      setError(errorMessage);
      setUiState('error');
    }
  };
  
  const handleLogBird = (bird: BirdType) => {
    addBirdToLog(bird);
    toast({
      title: 'Bird Logged!',
      description: `${bird.speciesName} has been added to your log.`,
      action: <ToastAction altText="Close">Close</ToastAction>,
    });
    resetState();
  };
  
  const ToastAction = ({ children, altText }: { children: React.ReactNode, altText: string }) => (
    <Button variant="ghost" className="text-white hover:bg-white/20">{children}</Button>
  );

  const renderContent = () => {
    switch (uiState) {
      case 'idle':
        return (
          <div className="flex-1 flex flex-col justify-stretch items-stretch">
            <Button variant="record" onClick={startRecording} className="w-full h-full text-4xl">
              <Microphone />
              <RecordButtonLabel />
            </Button>
          </div>
        );

      case 'recording':
        return (
          <div className="text-center flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold font-headline mb-4">Recording...</h2>
            <div className="flex justify-center items-center mb-8">
              <AudioLines className="w-16 h-16 text-primary animate-pulse" />
            </div>
            <Button size="lg" onClick={stopRecording} variant="destructive">Stop Recording</Button>
          </div>
        );

      case 'preview':
        return (
          <div className="text-center max-w-md mx-auto flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold font-headline mb-4">Audio Ready</h2>
            <p className="text-muted-foreground mb-6">Preview your audio below or proceed with analysis.</p>
            {audioUrl && <audio controls src={audioUrl} className="w-full mb-6 rounded-lg"></audio>}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => handleAnalyze()}><Search className="mr-2"/> Analyze</Button>
              <Button size="lg" variant="outline" onClick={resetState}>Start Over</Button>
            </div>
          </div>
        );

      case 'loading':
        return (
          <div className="text-center flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold font-headline mb-4">Analyzing...</h2>
            <p className="text-muted-foreground mb-8">Our AI is identifying the birds in your audio. This might take a moment.</p>
            <div className="flex justify-center items-center">
              <Loader className="w-16 h-16 animate-spin text-primary" />
            </div>
          </div>
        );

      case 'results':
        return (
          <div className="w-full max-w-4xl mx-auto text-center flex-1 flex flex-col justify-center">
            {!showOtherSuggestions && mainSuggestion ? (
              <>
                <h2 className="text-3xl font-bold font-headline mb-2">Is this your bird?</h2>
                <BirdCard bird={mainSuggestion} onLog={handleLogBird} primary />
                <div className="flex gap-4 justify-center mt-6">
                  <Button size="lg" onClick={() => handleLogBird(mainSuggestion)}><Check className="mr-2" /> Yes, log it!</Button>
                  <Button size="lg" variant="secondary" onClick={() => setShowOtherSuggestions(true)}>Show other options</Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold font-headline mb-6">Top Suggestions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {mainSuggestion && <BirdCard bird={mainSuggestion} onLog={handleLogBird} />}
                  {otherSuggestions.map(bird => <BirdCard key={bird.scientificName} bird={bird} onLog={handleLogBird} />)}
                </div>
              </>
            )}
            <Button variant="outline" className="mt-8" onClick={resetState}>Start Over</Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center max-w-md mx-auto flex-1 flex flex-col justify-center">
            <div className="mx-auto bg-destructive/10 text-destructive w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <XMark className="w-8 h-8"/>
            </div>
            <h2 className="text-3xl font-bold font-headline mb-4">An Error Occurred</h2>
            <p className="text-muted-foreground mb-6">{error || 'Something went wrong.'}</p>
            <Button size="lg" onClick={resetState}>Try Again</Button>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  const handleLocationSubmit = () => {
    if (manualEnvInput.trim()) {
      handleAnalyze(manualEnvInput);
    } else {
      toast({
        variant: 'destructive',
        title: 'Input required',
        description: 'Please describe your environment.'
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center flex-1">
      {renderContent()}

      <Dialog open={uiState === 'location_prompt'} onOpenChange={(open) => !open && resetState()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Location Information Needed</DialogTitle>
            <DialogDescription>
              We couldn't access your location. To improve accuracy, please briefly describe your current environment (e.g., "forest with pine trees", "urban park", "near a lake").
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="environment-description">Environment Description</Label>
              <Textarea
                id="environment-description"
                value={manualEnvInput}
                onChange={(e) => setManualEnvInput(e.target.value)}
                placeholder="e.g., quiet backyard with oak trees, sunny day"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetState}>Cancel</Button>
            <Button onClick={handleLocationSubmit}>Submit and Analyze</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const BirdCard: FC<{ bird: BirdType; onLog: (bird: BirdType) => void; primary?: boolean }> = ({ bird, onLog, primary = false }) => (
  <Card className={primary ? "border-primary border-2" : ""}>
    <CardHeader className="p-0">
      <div className="relative aspect-video w-full">
        <Image
          src={bird.imageUrl}
          alt={bird.speciesName}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover rounded-t-lg"
          data-ai-hint={bird.dataAiHint}
        />
      </div>
    </CardHeader>
    <CardContent className="p-4 text-left">
      <CardTitle className="font-headline text-xl mb-1">{bird.speciesName}</CardTitle>
      <p className="text-sm text-muted-foreground italic mb-2">{bird.scientificName}</p>
      <CardDescription className="text-sm line-clamp-3">{bird.description}</CardDescription>
      {!primary && (
        <Button className="w-full mt-4" onClick={() => onLog(bird)}>Log this bird</Button>
      )}
    </CardContent>
  </Card>
);

    