

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageTitle } from '@/components/content/PageTitle';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save, History, UploadCloud, Pencil } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { v4 as uuidv4 } from 'uuid';


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
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newPromptText, setNewPromptText] = useState('');
  const [versionType, setVersionType] = useState<'minor' | 'major'>('minor');
  const [enabledCategories, setEnabledCategories] = useState<Record<string, boolean>>({});
  
  const { toast } = useToast();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  const systemId = useMemo(() => SYSTEM_IDS[selectedMode], [selectedMode]);
  
  const currentCategoryHistory = useMemo(() => {
    return (promptContents[selectedCategory] || []).sort((a, b) => {
        if (a.version === 0) return -1; // Draft always first
        if (b.version === 0) return 1;
        return b.version - a.version;
    });
  }, [promptContents, selectedCategory]);

  const currentSelectedVersionId = useMemo(() => selectedVersions[selectedCategory] || currentCategoryHistory[0]?.id || '', [selectedVersions, selectedCategory, currentCategoryHistory]);
  const currentContent = useMemo(() => currentCategoryHistory.find(c => c.id === currentSelectedVersionId), [currentCategoryHistory, currentSelectedVersionId]);
  
  const draftContent = useMemo(() => currentCategoryHistory.find(c => c.version === 0), [currentCategoryHistory]);

  const fetchPromptData = useCallback(async () => {
    if (!isDevMode) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
        const systemQuery = query(collection(db, 'prompt_systems'), where('__name__', 'in', Object.values(SYSTEM_IDS)));
        const systemSnap = await getDocs(systemQuery);
        
        const activeSystemVersions: Record<string, string> = {};
        systemSnap.forEach(doc => {
            const data = doc.data() as PromptSystem;
            const mode = Object.keys(SYSTEM_IDS).find(key => SYSTEM_IDS[key as 'newbie' | 'twitcher'] === data.id) as 'newbie' | 'twitcher';
            if (mode) {
                activeSystemVersions[mode] = data.activeVersion;
            }
        });

        const activeVersionPromises = Object.entries(activeSystemVersions).map(async ([mode, versionString]) => {
            if (!versionString) return { mode, version: null };
            // A version string can be reused on recall, so we need the latest one.
            const versionQuery = query(
              collection(db, 'prompt_versions'), 
              where('systemId', '==', SYSTEM_IDS[mode as 'newbie' | 'twitcher']),
              where('version', '==', versionString), 
              orderBy('timestamp', 'desc')
            );

            const versionSnap = await getDocs(versionQuery);
            if (!versionSnap.empty) {
                const doc = versionSnap.docs[0];
                return { mode, version: { id: doc.id, ...doc.data() } as PromptVersion };
            }
            return { mode, version: null };
        });

        const resolvedActiveVersions = await Promise.all(activeVersionPromises);
        const newActiveVersionsState: Record<string, PromptVersion | null> = {};
        resolvedActiveVersions.forEach(({mode, version}) => {
            newActiveVersionsState[mode] = version;
        });
        setActiveVersions(newActiveVersionsState);
      
      const latestVersion = newActiveVersionsState[selectedMode];

      const contentQuery = query(collection(db, 'prompt_content'), where('systemId', '==', systemId));
      const contentSnapshot = await getDocs(contentQuery);
      const contents = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptContent));

      const contentsByCategory = contents.reduce((acc, content) => {
        const category = content.categoryId;
        if (!acc[category]) acc[category] = [];
        acc[category].push(content);
        return acc;
      }, {} as Record<string, PromptContent[]>);

      const allCategories = Array.from(new Set(Object.keys(contentsByCategory)));
      
      let initialEnabled: Record<string, boolean> = {};
      if (latestVersion) {
         Object.keys(latestVersion.composedPrompts).forEach(cat => initialEnabled[cat] = true);
      }
      allCategories.forEach(cat => {
        if (initialEnabled[cat] === undefined) {
           initialEnabled[cat] = false;
        }
      });
      setEnabledCategories(initialEnabled);

      if (allCategories.length > 0 && (!selectedCategory || !allCategories.includes(selectedCategory))) {
        setSelectedCategory(allCategories[0]);
      } else if (allCategories.length === 0) {
        setSelectedCategory('');
      }

      setPromptContents(contentsByCategory);

      const initialSelectedVersions = latestVersion ? { ...latestVersion.composedPrompts } : {};
      
      allCategories.forEach(cat => {
        const categoryContent = contentsByCategory[cat] || [];
        const draft = categoryContent.find(c => c.version === 0);
        
        if (!initialSelectedVersions[cat]) {
            if (draft) {
                initialSelectedVersions[cat] = draft.id;
            } else {
                const latestPublished = categoryContent.filter(c => c.version > 0).sort((a,b) => b.version - a.version)[0];
                if (latestPublished) {
                    initialSelectedVersions[cat] = latestPublished.id;
                }
            }
        }
      });
      setSelectedVersions(initialSelectedVersions);

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

  useEffect(() => {
      setNewPromptText('');
  }, [selectedMode, selectedCategory]);


  const handleSaveDraft = async () => {
    if (!selectedCategory) return;
    setIsSaving(true);
    try {
        const savedDraft = await savePromptContent({
            systemId,
            categoryId: selectedCategory,
            promptText: newPromptText,
            isDraft: true,
        });

        toast({ title: 'Draft Saved', description: 'Your changes have been saved to the cloud.' });
        
        setPromptContents(prev => {
            const categoryContents = prev[selectedCategory] || [];
            const existingDraftIndex = categoryContents.findIndex(c => c.version === 0);
            if (existingDraftIndex !== -1) {
                categoryContents[existingDraftIndex] = savedDraft;
            } else {
                categoryContents.push(savedDraft);
            }
            return {...prev, [selectedCategory]: categoryContents};
        });
        setSelectedVersions(prev => ({...prev, [selectedCategory]: savedDraft.id}));
        setNewPromptText('');

    } catch (error) {
        console.error("Failed to save draft:", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save draft.' });
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

  const publishFromDraft = async () => {
    if (!draftContent) {
        toast({ variant: 'destructive', title: 'Publish Failed', description: 'No draft to publish. Please save your changes first.'});
        return;
    }

    setIsPublishing(true);
    try {
        const newContent = await savePromptContent({
            systemId,
            categoryId: selectedCategory,
            promptText: draftContent.promptText,
            previousVersionId: currentCategoryHistory.filter(c => c.version > 0)[0]?.id,
            isDraft: false,
        });

        const promptsToPublish = { ...activeVersions[selectedMode]?.composedPrompts };
         if (enabledCategories[selectedCategory]) {
            promptsToPublish[selectedCategory] = newContent.id;
        }

        const newVersion = await publishNewPromptVersion({
            systemId: systemId,
            composedPrompts: promptsToPublish,
            previousVersion: activeVersions[selectedMode]?.version,
            versionType: versionType,
        });

        await fetchPromptData();
        toast({ title: 'Published!', description: `Successfully published version ${newVersion.version}.` });

    } catch (error) {
      console.error('Failed to publish new version:', error);
      toast({ variant: 'destructive', title: 'Publish Failed' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRecallVersion = async () => {
    if (!currentContent || currentContent.version === 0) {
      toast({ variant: 'destructive', title: 'Recall Failed', description: 'Cannot recall a draft from here.' });
      return;
    }

    setIsPublishing(true);
    try {
      
      const promptsToPublish: Record<string, string> = {
        ...activeVersions[selectedMode]?.composedPrompts,
        [selectedCategory]: currentContent.id
      };

      const newVersion = await publishNewPromptVersion({
        systemId: systemId,
        composedPrompts: promptsToPublish,
        previousVersion: activeVersions[selectedMode]?.version,
        versionType: 'recall',
      });

      await fetchPromptData();
      toast({ title: 'Recalled!', description: `Successfully published recalled configuration as version ${newVersion.version}.` });

    } catch (error) {
      console.error('Failed to recall version:', error);
      toast({ variant: 'destructive', title: 'Recall Failed' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleEditVersion = () => {
    if (!currentContent) return;
    setNewPromptText(currentContent.promptText);
    toast({
        title: 'Version Loaded',
        description: `Version ${currentContent.version > 0 ? currentContent.version : 'Draft'} text has been loaded into the editor. Save it as a draft to edit.`,
    });
  };

  if (!isDevMode) {
    return <p className="p-4">This page is only available in developer mode.</p>;
  }

  const hasUnsavedChanges = newPromptText.trim() !== '' && newPromptText.trim() !== (draftContent?.promptText || '').trim();
  const canSave = newPromptText.trim() !== '' && hasUnsavedChanges && !isSaving;
  const canPublish = !hasUnsavedChanges && !!draftContent;
  
  const activeVersionForMode = activeVersions[selectedMode];
  const activePromptContents = useMemo(() => {
    if (!activeVersionForMode) return [];
    
    const contentDetails: { categoryId: string; contentId: string; version: number }[] = [];
    
    for (const categoryId in activeVersionForMode.composedPrompts) {
        const contentId = activeVersionForMode.composedPrompts[categoryId];
        const contentHistory = promptContents[categoryId] || [];
        const content = contentHistory.find(c => c.id === contentId);
        if (content) {
            contentDetails.push({ categoryId, contentId, version: content.version });
        }
    }
    return contentDetails.sort((a,b) => a.categoryId.localeCompare(b.categoryId));
  }, [activeVersionForMode, promptContents]);


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <PageTitle>Bird Identifier AI Editor</PageTitle>
        <p className="max-w-2xl mx-auto text-muted-foreground mt-4">
          Select a mode and a prompt category to edit. Changes can be saved as new versions and then published as part of a new, overarching AI version.
        </p>
      </div>

      <Card className="mt-8 max-w-lg mx-auto">
        <CardHeader className="text-center">
            <CardTitle>AI Mode</CardTitle>
            <CardDescription>Select the AI mode you want to configure prompts for.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
            <Select value={selectedMode} onValueChange={(v) => setSelectedMode(v as 'newbie' | 'twitcher')}>
                <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select a mode..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="newbie">Newbie Mode</SelectItem>
                    <SelectItem value="twitcher">Twitcher Mode</SelectItem>
                </SelectContent>
            </Select>
        </CardContent>
      </Card>
      
      <Card className="mt-4 max-w-lg mx-auto">
        <CardHeader className="text-center">
            <CardTitle>Prompt Category</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center gap-2">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[280px]">
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
                    <Button variant="ghost" size="icon">
                        <Plus className="h-4 w-4"/>
                    </Button>
                </DialogTrigger>
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
        </CardContent>
      </Card>
      
      <Card className="mt-4 max-w-lg mx-auto">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold leading-none tracking-tight">Active Prompt Configuration</CardTitle>
            <CardDescription>
                This is the currently published configuration for the <strong>{selectedMode}</strong> AI (Version {activeVersions[selectedMode]?.version || 'N/A'}).
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Active Version</TableHead>
                        <TableHead className="text-center">Published</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         Array.from({length: 3}).map((_, i) => (
                           <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-6 w-10 mx-auto" /></TableCell>
                           </TableRow>
                        ))
                    ) : activePromptContents.length > 0 ? (
                        activePromptContents.map(item => (
                            <TableRow key={item.categoryId}>
                                <TableCell className="font-medium capitalize">{item.categoryId.replace(/_/g, ' ')}</TableCell>
                                <TableCell className="text-center">v{item.version}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="default">Yes</Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                No prompts are published for this mode yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>


      <div className="mt-8 flex flex-col md:flex-row gap-6">
        {isLoading ? (
            <div className="flex justify-center items-center p-8 w-full"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <>
            <Card className="flex-1">
               <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold leading-none tracking-tight">Version History</CardTitle>
                <div className="flex items-center justify-center gap-2 pt-2">
                    <Select
                        value={currentSelectedVersionId}
                        onValueChange={(versionId) => setSelectedVersions(prev => ({ ...prev, [selectedCategory]: versionId }))}
                        disabled={currentCategoryHistory.length === 0}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a version to view..." />
                    </SelectTrigger>
                    <SelectContent>
                        {currentCategoryHistory.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                            {item.version === 0 ? `Draft - ${new Date(item.timestamp).toLocaleString()}` : `Version ${item.version} - ${new Date(item.timestamp).toLocaleString()}`}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <Button onClick={handleEditVersion} variant="outline" size="sm" disabled={!currentContent}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button onClick={handleRecallVersion} variant="outline" size="sm" disabled={!currentContent || currentContent.version === 0 || isPublishing}>
                        {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />} Recall
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={currentContent?.promptText || ''}
                  readOnly
                  className="min-h-[300px] font-mono text-sm bg-muted"
                  placeholder="No content for this category yet. Write something new in the editor below."
                />
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="text-center">
                 <CardTitle className="text-2xl font-semibold leading-none tracking-tight">New/Edit Prompt Text</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="new-prompt-text"
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Write new prompt content here, or recall a version to use as a template."
                  disabled={!selectedCategory}
                />
              </CardContent>
              <CardFooter>
                 <div className="flex items-center gap-2">
                    <Select value={versionType} onValueChange={(v) => setVersionType(v as 'minor' | 'major')}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="minor">Minor-Ver</SelectItem>
                            <SelectItem value="major">Major-Ver</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleSaveDraft} disabled={!canSave}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save
                    </Button>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="inline-block">
                                    <Button onClick={publishFromDraft} disabled={!canPublish || isPublishing}>
                                        {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                                        Publish
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {!canPublish && (
                                <TooltipContent>
                                    <p>Save changes to a draft to enable publishing.</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                   </div>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

