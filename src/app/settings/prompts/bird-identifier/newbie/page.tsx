
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageTitle } from '@/components/content/PageTitle';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { publishNewPromptVersion, savePromptContent } from '@/lib/actions';
import type { PromptContent, PromptVersion } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SYSTEM_ID = 'bird-identifier-ai-newbie';

export default function NewbiePromptEditorPage() {
  const [activeVersion, setActiveVersion] = useState<PromptVersion | null>(null);
  const [promptContents, setPromptContents] = useState<Record<string, PromptContent[]>>({});
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const { toast } = useToast();

  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    if (!isDevMode) {
      setIsLoading(false);
      return;
    }

    async function fetchPromptData() {
      setIsLoading(true);
      try {
        // 1. Get the active version for the system
        const versionsQuery = query(
          collection(db, 'prompt_versions'),
          where('systemId', '==', SYSTEM_ID),
          orderBy('version', 'desc')
        );
        const versionsSnapshot = await getDocs(versionsQuery);
        const latestVersionDoc = versionsSnapshot.docs[0];
        
        let initialCategories = ['base_instruction', 'location_handling', 'audio_quality'];
        let initialSelected: Record<string, string> = {};

        if (latestVersionDoc) {
            const latestVersion = { id: latestVersionDoc.id, ...latestVersionDoc.data() } as PromptVersion;
            setActiveVersion(latestVersion);
            initialCategories = Object.keys(latestVersion.composedPrompts);
            Object.keys(latestVersion.composedPrompts).forEach(key => {
                initialSelected[key] = latestVersion.composedPrompts[key];
            });
            setSelectedVersions(initialSelected);
        } else {
            // Handle case where there are no versions yet for this system
            initialCategories.forEach(cat => { initialSelected[cat] = ''; });
            setSelectedVersions(initialSelected);
        }

        // 2. Fetch all content for each category
        const contentPromises = initialCategories.map(async (category) => {
            const contentQuery = query(
                collection(db, 'prompt_content'),
                where('systemId', '==', SYSTEM_ID),
                where('categoryId', '==', category),
                orderBy('version', 'desc')
            );
            const contentSnapshot = await getDocs(contentQuery);
            const contents = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptContent));
            return { category, contents };
        });

        const results = await Promise.all(contentPromises);
        const contentsByCategory: Record<string, PromptContent[]> = {};
        results.forEach(result => {
            contentsByCategory[result.category] = result.contents;
             // Ensure a version is selected if one exists
            if (!initialSelected[result.category] && result.contents.length > 0) {
              initialSelected[result.category] = result.contents[0].id;
            }
        });
        setPromptContents(contentsByCategory);
        setSelectedVersions(initialSelected);


      } catch (error) {
        console.error('Error fetching prompt data:', error);
        toast({
          variant: 'destructive',
          title: 'Load Failed',
          description: 'Could not load prompt data from Firestore.',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchPromptData();
  }, [isDevMode, toast]);

  const handleContentChange = (categoryId: string, newText: string) => {
    // Find the currently selected prompt for this category and update its text
     const currentVersionId = selectedVersions[categoryId];
     const categoryContents = promptContents[categoryId] || [];
     const updatedContents = categoryContents.map(c => 
        c.id === currentVersionId ? { ...c, promptText: newText } : c
     );
     setPromptContents(prev => ({ ...prev, [categoryId]: updatedContents }));
  };

  const handleVersionChange = (categoryId: string, versionId: string) => {
    setSelectedVersions(prev => ({ ...prev, [categoryId]: versionId }));
  };

  const handleSaveContent = async (categoryId: string) => {
    const currentVersionId = selectedVersions[categoryId];
    const currentContent = promptContents[categoryId]?.find(c => c.id === currentVersionId);

    if (!currentContent?.promptText && history.length === 0) {
        toast({ variant: 'destructive', title: 'Cannot Save', description: 'Prompt content cannot be empty.' });
        return;
    }
    
    const textToSave = currentContent?.promptText || '';

    setIsSaving(prev => ({ ...prev, [categoryId]: true }));
    try {
        const newContent = await savePromptContent({
            systemId: SYSTEM_ID,
            categoryId: categoryId,
            promptText: textToSave,
            previousVersionId: currentVersionId,
        });

        // Update UI with new version
        setPromptContents(prev => ({
            ...prev,
            [categoryId]: [newContent, ...(prev[categoryId] || [])],
        }));
        setSelectedVersions(prev => ({ ...prev, [categoryId]: newContent.id }));

        toast({ title: 'Prompt Saved', description: `${categoryId} was updated to version ${newContent.version}.` });
    } catch (error) {
        console.error('Failed to save prompt content:', error);
        toast({ variant: 'destructive', title: 'Save Failed' });
    } finally {
        setIsSaving(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategory) return;
    const categoryId = newCategory.trim().toLowerCase().replace(/\s+/g, '_');
    if (promptContents[categoryId]) {
        toast({ variant: 'destructive', title: 'Category Exists', description: 'This prompt category already exists.' });
        return;
    }

    // Optimistically update UI
    setPromptContents(prev => ({ ...prev, [categoryId]: [] }));
    setSelectedVersions(prev => ({ ...prev, [categoryId]: '' }));
    setNewCategory('');
  };
  
  const handlePublish = async () => {
      setIsPublishing(true);
      try {
          const composedPrompts: Record<string, string> = {};
          for (const category in selectedVersions) {
              if(selectedVersions[category]) {
                composedPrompts[category] = selectedVersions[category];
              }
          }

          if (Object.keys(composedPrompts).length === 0) {
            toast({ variant: 'destructive', title: 'Cannot Publish', description: 'You must have at least one prompt category with a selected version.'});
            setIsPublishing(false);
            return;
          }

          const newVersion = await publishNewPromptVersion({
              systemId: SYSTEM_ID,
              composedPrompts: composedPrompts,
              previousVersion: activeVersion?.version
          });
          setActiveVersion(newVersion);
          toast({ title: 'Published!', description: `Successfully published version ${newVersion.version}.`});
      } catch (error) {
          console.error('Failed to publish new version:', error);
          toast({ variant: 'destructive', title: 'Publish Failed' });
      } finally {
          setIsPublishing(false);
      }
  }

  if (!isDevMode) {
    return <p className="p-4">This page is only available in developer mode.</p>;
  }

  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-4">
        <div>
            <PageTitle>Newbie Mode Prompt Editor</PageTitle>
            <p className="text-muted-foreground max-w-2xl mt-2">
                Manage the individual prompt components for the Newbie Mode Bird Identifier. Each card is a piece of the final prompt sent to the AI.
            </p>
        </div>
        <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Active Version</p>
            <p className="text-2xl font-bold">{activeVersion?.version || 'N/A'}</p>
        </Card>
      </div>

      <div className="space-y-6">
        {Object.keys(promptContents).sort().map(categoryId => {
            const history = promptContents[categoryId] || [];
            const selectedContentId = selectedVersions[categoryId] || history[0]?.id || '';
            const content = history.find(c => c.id === selectedContentId);
            const isSavingThis = isSaving[categoryId];

            return (
                <Card key={categoryId}>
                    <CardHeader>
                        <CardTitle className="capitalize">{categoryId.replace(/_/g, ' ')}</CardTitle>
                        <CardDescription>Select a version or edit the content below and save as a new version.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select
                            value={selectedContentId}
                            onValueChange={(versionId) => handleVersionChange(categoryId, versionId)}
                            disabled={history.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a version..." />
                            </SelectTrigger>
                            <SelectContent>
                                {history.map(item => (
                                    <SelectItem key={item.id} value={item.id}>
                                        Version {item.version} - {new Date(item.timestamp).toLocaleString()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Textarea
                            value={content?.promptText || ''}
                            onChange={(e) => handleContentChange(categoryId, e.target.value)}
                            className="min-h-[150px] font-mono text-sm"
                            placeholder="Enter prompt content for this category..."
                        />
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => handleSaveContent(categoryId)} disabled={isSavingThis}>
                            {isSavingThis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save as New Version
                        </Button>
                    </CardFooter>
                </Card>
            );
        })}

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add New Prompt Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new component for the AI's prompt. Use a short, descriptive name (e.g., 'error_handling').
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category-name" className="text-right">Name</Label>
                <Input
                  id="category-name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., audio_analysis_rules"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddNewCategory}>Add Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
       <div className="mt-8 border-t pt-6 text-right">
            <Button size="lg" onClick={handlePublish} disabled={isPublishing}>
                {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Publish New AI Version
            </Button>
            <p className="text-xs text-muted-foreground mt-2">This will save the current selection of prompt versions as a new, active version of the AI.</p>
       </div>
    </div>
  );
}

    