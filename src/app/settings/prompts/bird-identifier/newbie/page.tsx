
'use client';

import { useState, useEffect, useMemo } from 'react';
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
const ADD_NEW_CATEGORY_VALUE = 'add_new_category';

export default function NewbiePromptEditorPage() {
  const [activeVersion, setActiveVersion] = useState<PromptVersion | null>(null);
  const [promptContents, setPromptContents] = useState<Record<string, PromptContent[]>>({});
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

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
        const versionsQuery = query(
          collection(db, 'prompt_versions'),
          where('systemId', '==', SYSTEM_ID),
          orderBy('version', 'desc')
        );
        const versionsSnapshot = await getDocs(versionsQuery);
        const latestVersionDoc = versionsSnapshot.docs[0];
        
        let initialCategories = ['base_instruction', 'location_handling'];
        let initialSelected: Record<string, string> = {};

        if (latestVersionDoc) {
            const latestVersion = { id: latestVersionDoc.id, ...latestVersionDoc.data() } as PromptVersion;
            setActiveVersion(latestVersion);
            initialCategories = Object.keys(latestVersion.composedPrompts);
            initialSelected = { ...latestVersion.composedPrompts };
            setSelectedVersions(initialSelected);
        } else {
            initialCategories.forEach(cat => { initialSelected[cat] = ''; });
            setSelectedVersions(initialSelected);
        }

        if (initialCategories.length > 0 && !selectedCategory) {
            setSelectedCategory(initialCategories[0]);
        }

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
  }, [isDevMode, toast, selectedCategory]);

  const handleContentChange = (newText: string) => {
    if (!selectedCategory) return;
    const currentVersionId = selectedVersions[selectedCategory];
    const categoryContents = promptContents[selectedCategory] || [];
    const updatedContents = categoryContents.map(c => 
        c.id === currentVersionId ? { ...c, promptText: newText } : c
    );
    setPromptContents(prev => ({ ...prev, [selectedCategory]: updatedContents }));
  };

  const handleVersionChange = (versionId: string) => {
     if (!selectedCategory) return;
    setSelectedVersions(prev => ({ ...prev, [selectedCategory]: versionId }));
  };

  const handleSaveContent = async () => {
    if (!selectedCategory) return;
    const currentVersionId = selectedVersions[selectedCategory];
    const currentContent = promptContents[selectedCategory]?.find(c => c.id === currentVersionId);
    const textToSave = currentContent?.promptText || '';

    if (!textToSave && promptContents[selectedCategory]?.length === 0) {
        toast({ variant: 'destructive', title: 'Cannot Save', description: 'Prompt content cannot be empty.' });
        return;
    }

    setIsSaving(true);
    try {
        const newContent = await savePromptContent({
            systemId: SYSTEM_ID,
            categoryId: selectedCategory,
            promptText: textToSave,
            previousVersionId: currentVersionId,
        });

        setPromptContents(prev => ({
            ...prev,
            [selectedCategory]: [newContent, ...(prev[selectedCategory] || [])],
        }));
        setSelectedVersions(prev => ({ ...prev, [selectedCategory]: newContent.id }));

        toast({ title: 'Prompt Saved', description: `${selectedCategory} was updated to version ${newContent.version}.` });
    } catch (error) {
        console.error('Failed to save prompt content:', error);
        toast({ variant: 'destructive', title: 'Save Failed' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName) return;
    const categoryId = newCategoryName.trim().toLowerCase().replace(/\s+/g, '_');
    if (promptContents[categoryId]) {
        toast({ variant: 'destructive', title: 'Category Exists' });
        return;
    }

    setPromptContents(prev => ({ ...prev, [categoryId]: [] }));
    setSelectedVersions(prev => ({ ...prev, [categoryId]: '' }));
    setSelectedCategory(categoryId);
    setNewCategoryName('');
    setIsNewCategoryDialogOpen(false);
  };

  const handleCategorySelect = (categoryId: string) => {
    if (categoryId === ADD_NEW_CATEGORY_VALUE) {
        setIsNewCategoryDialogOpen(true);
    } else {
        setSelectedCategory(categoryId);
    }
  }
  
  const handlePublish = async () => {
      setIsPublishing(true);
      try {
          const composedPrompts = { ...selectedVersions };
          if (Object.values(composedPrompts).every(v => !v)) {
            toast({ variant: 'destructive', title: 'Cannot Publish', description: 'Select at least one version for a prompt category.'});
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

  const currentCategoryHistory = useMemo(() => promptContents[selectedCategory] || [], [promptContents, selectedCategory]);
  const currentSelectedVersionId = useMemo(() => selectedVersions[selectedCategory] || currentCategoryHistory[0]?.id || '', [selectedVersions, selectedCategory, currentCategoryHistory]);
  const currentContent = useMemo(() => currentCategoryHistory.find(c => c.id === currentSelectedVersionId), [currentCategoryHistory, currentSelectedVersionId]);

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

      <Dialog open={isNewCategoryDialogOpen} onOpenChange={setIsNewCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Prompt Category</DialogTitle>
              <DialogDescription>
                Create a new component for the AI's prompt. Use a short, descriptive name (e.g., 'error_handling').
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category-name" className="text-right">Name</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
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
      
      <Card>
          <CardHeader>
              <CardTitle>Prompt Category</CardTitle>
              <CardDescription>Select a prompt category to view or edit its content and version history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex gap-4">
                 <Select value={selectedCategory} onValueChange={handleCategorySelect}>
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.keys(promptContents).sort().map(categoryId => (
                            <SelectItem key={categoryId} value={categoryId} className="capitalize">{categoryId.replace(/_/g, ' ')}</SelectItem>
                        ))}
                        <SelectItem value={ADD_NEW_CATEGORY_VALUE} className="text-primary">
                           <Plus className="inline-block mr-2 h-4 w-4" /> Add New Category...
                        </SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={currentSelectedVersionId}
                    onValueChange={handleVersionChange}
                    disabled={currentCategoryHistory.length === 0}
                >
                    <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Select a version..." />
                    </SelectTrigger>
                    <SelectContent>
                        {currentCategoryHistory.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                                Version {item.version} - {new Date(item.timestamp).toLocaleString()}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              
              <Textarea
                  value={currentContent?.promptText || ''}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="min-h-[250px] font-mono text-sm"
                  placeholder="Select a category to start editing..."
                  disabled={!selectedCategory}
              />
          </CardContent>
          <CardFooter>
              <Button onClick={handleSaveContent} disabled={isSaving || !selectedCategory}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save as New Version
              </Button>
          </CardFooter>
      </Card>
      
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
