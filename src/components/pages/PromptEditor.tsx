
'use client';

import { useState, useEffect } from 'react';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { PageTitle } from '@/components/content/PageTitle';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { savePrompt } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';

interface PromptEditorProps {
  promptPath: string;
  title: string;
  description: string;
}

export function PromptEditor({ promptPath, title, description }: PromptEditorProps) {
  const [promptContent, setPromptContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';


  useEffect(() => {
    if (!isDevMode) {
        setIsLoading(false);
        return;
    };

    async function fetchPrompt() {
      setIsLoading(true);
      try {
        const promptRef = ref(storage, promptPath);
        const url = await getDownloadURL(promptRef);
        const response = await fetch(url);
        const text = await response.text();
        setPromptContent(text);
      } catch (error) {
        console.error(`Failed to fetch prompt: ${promptPath}`, error);
        toast({
          variant: 'destructive',
          title: 'Load Failed',
          description: `Could not load the prompt from storage. It may not exist yet.`,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrompt();
  }, [promptPath, toast, isDevMode]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await savePrompt({ promptPath, promptContent });
      toast({
        title: 'Prompt Saved',
        description: 'Your changes have been successfully saved to storage.',
      });
    } catch (error) {
      console.error(`Failed to save prompt: ${promptPath}`, error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save the prompt. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isDevMode) {
    return <p>This page is only available in developer mode.</p>;
  }

  return (
    <Card>
        <CardHeader>
            <PageTitle>{title}</PageTitle>
            <p className="text-muted-foreground max-w-2xl">{description}</p>
        </CardHeader>
        <CardContent>
             {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-64 w-full" />
                </div>
             ) : (
                <Textarea
                    value={promptContent}
                    onChange={(e) => setPromptContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="Enter prompt content here..."
                />
             )}
        </CardContent>
        <CardFooter>
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Prompt
            </Button>
        </CardFooter>
    </Card>
  );
}
