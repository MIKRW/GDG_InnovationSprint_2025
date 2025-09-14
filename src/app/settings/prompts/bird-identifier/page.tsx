'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import type { PromptContent, PromptVersion, PromptSystem } from '@/lib/types';
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

const ADD_NEW_CATEGORY_VALUE = 'add_new_category';

const SYSTEM_IDS = {
  newbie: 'bird-identifier-ai-newbie',
  twitcher: 'bird-identifier-ai-twitcher',
};

export default function BirdIdentifierPromptEditorPage() {
  const [selectedMode, setSelectedMode] = useState<'newbie' | 'twitcher'>('newbie');
  const [activeVersions, setActiveVersions] = useState<Record<string, PromptVersion | null>>({ newbie: null, twitcher: null });
  const [promptContents, setPromptContents] = useState<Record<string, PromptContent[]>>({});
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newPromptText, setNewPromptText] = useState('');

  const { toast } = useToast();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  const systemId = useMemo(() => SYSTEM_IDS[selectedMode], [selectedMode]);

  const fetchPromptData = useCallback(async () => {
    if (!isDevMode) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const versionsQuery = query(
        collection(db, 'prompt_versions'),
        where('systemId', '==', systemId),
        orderBy('version', 'desc')
      );
      const versionsSnapshot = await getDocs(versionsQuery);
      const latestVersionDoc = versionsSnapshot.docs[0];

      let initialCategories: string[] = [];
      let initialSelected: Record<string, string> = {};

      if (latestVersionDoc) {
        const latestVersion = { id: latestVersionDoc.id, ...latestVersionDoc.data() } as PromptVersion;
        setActiveVersions(prev => ({ ...prev, [selectedMode]: latestVersion }));
        initialCategories = Object.keys(latestVersion.composedPrompts);
        initialSelected = { ...latestVersion.composedPrompts };
      } else {
        setActiveVersions(prev => ({ ...prev, [selectedMode]: null }));
      }

      const contentQuery = query(collection(db, 'prompt_content'), where('systemId', '==', systemId));
      const contentSnapshot = await getDocs(contentQuery);
      const contents = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptContent));

      const contentsByCategory = contents.reduce((acc, content) => {
        const category = content.categoryId;
        if (!acc[category]) acc[category] = [];
        acc[category].push(content);
        return acc;
      }, {} as Record<string, PromptContent[]>);

      for (const category in contentsByCategory) {
        contentsByCategory[category].sort((a, b) => b.version - a.version);
      }

      const allCategories = Array.from(new Set([...initialCategories, ...Object.keys(contentsByCategory)]));

      if (allCategories.length > 0 && (!selectedCategory || !allCategories.includes(selectedCategory))) {
        setSelectedCategory(allCategories[0]);
      } else if (allCategories.length === 0) {
        setSelectedCategory('');
      }

      setPromptContents(contentsByCategory);

      const finalSelectedVersions = { ...initialSelected };
      allCategories.forEach(cat => {
        if (!finalSelectedVersions[cat] && contentsByCategory[cat]?.[0]) {
          finalSelectedVersions[cat] = contentsByCategory[cat][0].id;
        }
      });
      setSelectedVersions(finalSelectedVersions);

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
  }, [isDevMode, systemId, selectedMode, toast, selectedCategory]);

  useEffect(() => {
    fetchPromptData();
  }, [fetchPromptData]);

  const currentCategoryHistory = useMemo(() => promptContents[selectedCategory] || [], [promptContents, selectedCategory]);
  const currentSelectedVersionId = useMemo(() => selectedVersions[selectedCategory] || currentCategoryHistory[0]?.id || '', [selectedVersions, selectedCategory, currentCategoryHistory]);
  const currentContent = useMemo(() => currentCategoryHistory.find(c => c.id === currentSelectedVersionId), [currentCategoryHistory, currentSelectedVersionId]);

  useEffect(() => {
    setNewPromptText(currentContent?.promptText || '');
  }, [currentContent]);

  const handleSaveContent = async () => {
    if (!selectedCategory) return;
    if (!newPromptText) {
      toast({ variant: 'destructive', title: 'Cannot Save', description: 'Prompt content cannot be empty.' });
      return;
    }
    setIsSaving(true);
    try {
      const newContent = await savePromptContent({
        systemId,
        categoryId: selectedCategory,
        promptText: newPromptText,
        previousVersionId: currentSelectedVersionId,
      });
      setPromptContents(prev => ({ ...prev, [selectedCategory]: [newContent, ...(prev[selectedCategory] || [])] }));
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
    if (Object.keys(promptContents).includes(categoryId)) {
      toast({ variant: 'destructive', title: 'Category Exists' });
      return;
    }
    setPromptContents(prev => ({ ...prev, [categoryId]: [] }));
    setSelectedVersions(prev => ({ ...prev, [categoryId]: '' }));
    setSelectedCategory(categoryId);
    setNewCategoryName('');
    setIsNewCategoryDialogOpen(false);
    setNewPromptText('');
  };

  const handleCategorySelect = (categoryId: string) => {
    if (categoryId === ADD_NEW_CATEGORY_VALUE) {
      setIsNewCategoryDialogOpen(true);
    } else {
      setSelectedCategory(categoryId);
    }
  };

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
        systemId: systemId,
        composedPrompts: composedPrompts,
        previousVersion: activeVersions[selectedMode]?.version,
      });
      setActiveVersions(prev => ({ ...prev, [selectedMode]: newVersion }));
      toast({ title: 'Published!', description: `Successfully published version ${newVersion.version}.` });
    } catch (error) {
      console.error('Failed to publish new version:', error);
      toast({ variant: 'destructive', title: 'Publish Failed' });
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isDevMode) {
    return <p className="p-4">This page is only available in developer mode.</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <PageTitle>Bird Identifier AI Editor</PageTitle>
        <p className="max-w-2xl mx-auto text-muted-foreground mt-4">
          Select a mode and a prompt category to edit. Changes can be saved as new versions and then published as part of a new, overarching AI version.
        </p>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>AI Mode</Label>
              <Select value={selectedMode} onValueChange={(v) => setSelectedMode(v as 'newbie' | 'twitcher')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a mode..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newbie">Newbie Mode</SelectItem>
                  <SelectItem value="twitcher">Twitcher Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Prompt Category</Label>
              <Select value={selectedCategory} onValueChange={handleCategorySelect}>
                <SelectTrigger>
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label>Current Version</Label>
                    <Select
                        value={currentSelectedVersionId}
                        onValueChange={(versionId) => setSelectedVersions(prev => ({ ...prev, [selectedCategory]: versionId }))}
                        disabled={currentCategoryHistory.length === 0}
                    >
                        <SelectTrigger className="mb-2">
                            <SelectValue placeholder="Select a version to view..." />
                        </SelectTrigger>
                        <SelectContent>
                            {currentCategoryHistory.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                    Version {item.version} - {new Date(item.timestamp).toLocaleString()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Textarea
                        value={currentContent?.promptText || ''}
                        readOnly
                        className="min-h-[300px] font-mono text-sm bg-muted"
                        placeholder="No content for this category yet. Write something new on the right."
                    />
                </div>
                <div>
                    <Label htmlFor="new-prompt-text">New Prompt Text</Label>
                    <Textarea
                        id="new-prompt-text"
                        value={newPromptText}
                        onChange={(e) => setNewPromptText(e.target.value)}
                        className="min-h-[300px] font-mono text-sm"
                        placeholder="Write new prompt content here..."
                        disabled={!selectedCategory}
                    />
                    <Button onClick={handleSaveContent} disabled={isSaving || !selectedCategory || !newPromptText} className="mt-2">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save as New Version
                    </Button>
                </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center border-t pt-6">
          <div>
            <p className="text-sm text-muted-foreground">Active {selectedMode} version</p>
            <p className="text-lg font-bold">{activeVersions[selectedMode]?.version || 'N/A'}</p>
          </div>
           <Button size="lg" onClick={handlePublish} disabled={isPublishing}>
                {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Publish New '{selectedMode}' AI Version
            </Button>
        </CardFooter>
      </Card>
      
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

    </div>
  );
}
