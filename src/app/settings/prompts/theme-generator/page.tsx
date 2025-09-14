'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageTitle } from '@/components/content/PageTitle';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save, History } from 'lucide-react';
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
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const SYSTEM_ID = 'theme-generator-ai';

export default function ThemeGeneratorPromptEditorPage() {
  const [activeVersion, setActiveVersion] = useState<PromptVersion | null>(null);
  const [promptContents, setPromptContents] = useState<Record<string, PromptContent[]>>({});
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newPromptText, setNewPromptText] = useState('');
  const [enabledCategories, setEnabledCategories] = useState<Record<string, boolean>>({});

  const { toast } = useToast();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  const fetchPromptData = useCallback(async () => {
    if (!isDevMode) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const versionsQuery = query(
        collection(db, 'prompt_versions'),
        where('systemId', '==', SYSTEM_ID),
        orderBy('version', 'desc')
      );
      const versionsSnapshot = await getDocs(versionsQuery);
      const latestVersionDoc = versionsSnapshot.docs[0];

      let initialCategories: string[] = [];
      let initialSelected: Record<string, string> = {};
      let initialEnabled: Record<string, boolean> = {};

      if (latestVersionDoc) {
        const latestVersion = { id: latestVersionDoc.id, ...latestVersionDoc.data() } as PromptVersion;
        setActiveVersion(latestVersion);
        initialCategories = Object.keys(latestVersion.composedPrompts);
        initialSelected = { ...latestVersion.composedPrompts };
        initialCategories.forEach(cat => initialEnabled[cat] = true);
      } else {
        setActiveVersion(null);
      }

      const contentQuery = query(collection(db, 'prompt_content'), where('systemId', '==', SYSTEM_ID));
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
      
      allCategories.forEach(cat => {
        if (initialEnabled[cat] === undefined) {
           initialEnabled[cat] = false;
        }
      });
      setEnabledCategories(initialEnabled);

      if (allCategories.length > 0 && (!selectedCategory || !allCategories.includes(selectedCategory))) {
        setSelectedCategory(allCategories[0] || 'base_instruction');
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
  }, [isDevMode, toast, selectedCategory]);

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
        systemId: SYSTEM_ID,
        categoryId: selectedCategory,
        promptText: newPromptText,
        previousVersionId: currentSelectedVersionId,
      });
      await fetchPromptData();
      setSelectedVersions(prev => ({ ...prev, [selectedCategory]: newContent.id }));
      setEnabledCategories(prev => ({...prev, [selectedCategory]: true }));
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
    setEnabledCategories(prev => ({...prev, [categoryId]: true }));
    setSelectedCategory(categoryId);
    setNewCategoryName('');
    setIsNewCategoryDialogOpen(false);
    setNewPromptText('');
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
        const promptsToPublish = Object.entries(selectedVersions)
            .filter(([categoryId]) => enabledCategories[categoryId])
            .reduce((acc, [categoryId, versionId]) => {
                if (versionId) {
                    acc[categoryId] = versionId;
                }
                return acc;
            }, {} as Record<string, string>);

        if (Object.keys(promptsToPublish).length === 0) {
            toast({ variant: 'destructive', title: 'Cannot Publish', description: 'At least one enabled category must have a selected version.'});
            setIsPublishing(false);
            return;
        }

      const newVersion = await publishNewPromptVersion({
        systemId: SYSTEM_ID,
        composedPrompts: promptsToPublish,
        previousVersion: activeVersion?.version,
      });
      setActiveVersion(newVersion);
      toast({ title: 'Published!', description: `Successfully published version ${newVersion.version}. This is now the active version for this AI system.` });
    } catch (error) {
      console.error('Failed to publish new version:', error);
      toast({ variant: 'destructive', title: 'Publish Failed' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRecallVersion = () => {
    if (!currentSelectedVersionId) return;
    setSelectedVersions(prev => ({ ...prev, [selectedCategory]: currentSelectedVersionId }));
    toast({
        title: 'Version Recalled',
        description: `Category '${selectedCategory.replace(/_/g, ' ')}' is now set to use version ${currentContent?.version}. Publish to make it live.`,
    });
  };

  if (!isDevMode) {
    return <p className="p-4">This page is only available in developer mode.</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <PageTitle>Theme Generator AI Editor</PageTitle>
        <p className="max-w-2xl mx-auto text-muted-foreground mt-4">
          Manage the prompts that guide the AI in creating color palettes from user-provided words and moods.
        </p>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Prompt Category</Label>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                    <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                    {Object.keys(promptContents).sort().map(categoryId => (
                        <SelectItem key={categoryId} value={categoryId} className="capitalize">{categoryId.replace(/_/g, ' ')}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                 <Dialog open={isNewCategoryDialogOpen} onOpenChange={setIsNewCategoryDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <Plus className="h-4 w-4 mr-2"/> Add New
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Prompt Category</DialogTitle>
                            <DialogDescription>
                            Create a new component for the AI's prompt. Use a short, descriptive name (e.g., 'color_theory_rules').
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
                                placeholder="e.g., color_theory_rules"
                            />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddNewCategory}>Add Category</Button>
                        </DialogFooter>
                        </DialogContent>
                    </Dialog>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label>Version History</Label>
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
                    <Button onClick={handleRecallVersion} variant="outline" size="sm" className="mb-2" disabled={!currentSelectedVersionId || currentCategoryHistory.length === 0}>
                        <History className="mr-2 h-4 w-4" /> Recall this Version
                    </Button>
                    <Textarea
                        value={currentContent?.promptText || ''}
                        readOnly
                        className="min-h-[300px] font-mono text-sm bg-muted"
                        placeholder="No content for this category yet. Start by creating a 'base_instruction'."
                    />
                </div>
                <div>
                    <Label htmlFor="new-prompt-text">New/Edit Prompt Text</Label>
                    <Textarea
                        id="new-prompt-text"
                        value={newPromptText}
                        onChange={(e) => setNewPromptText(e.target.value)}
                        className="min-h-[300px] font-mono text-sm"
                        placeholder="Write new prompt content here..."
                        disabled={!selectedCategory}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <Button onClick={handleSaveContent} disabled={isSaving || !selectedCategory || !newPromptText}>
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Save as New Version
                      </Button>
                      <Button size="lg" onClick={handlePublish} disabled={isPublishing}>
                          {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Publish New Theme AI Version
                      </Button>
                    </div>
                </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 border-t pt-6">
            <div>
                <CardTitle className="text-lg mb-2">Enabled Prompt Categories</CardTitle>
                <CardDescription>
                Toggle which categories are included in the published AI version. A category must be enabled and have a selected version to be included.
                </CardDescription>
                 <div className="mt-4 space-y-2">
                    {Object.keys(promptContents).sort().map(categoryId => (
                        <div key={categoryId} className="flex items-center justify-between p-2 rounded-md border">
                            <Label htmlFor={`switch-${categoryId}`} className="capitalize flex-1 cursor-pointer">{categoryId.replace(/_/g, ' ')}</Label>
                             <div className="flex items-center gap-4">
                               <Badge variant={enabledCategories[categoryId] ? 'default' : 'secondary'}>
                                {enabledCategories[categoryId] ? 'Enabled' : 'Disabled'}
                               </Badge>
                                <Switch
                                    id={`switch-${categoryId}`}
                                    checked={enabledCategories[categoryId] || false}
                                    onCheckedChange={(checked) => setEnabledCategories(prev => ({...prev, [categoryId]: checked}))}
                                />
                             </div>
                        </div>
                    ))}
                 </div>
            </div>
        </CardFooter>
      </Card>

    </div>
  );
}
