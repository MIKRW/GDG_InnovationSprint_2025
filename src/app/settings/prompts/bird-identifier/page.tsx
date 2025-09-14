

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageTitle } from '@/components/content/PageTitle';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Save, History, UploadCloud, Pencil, ChevronRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { publishNewPromptVersion, savePromptContent } from '@/lib/actions';
import type { PromptContent, PromptVersion, PromptSystem, AppAIVersion } from '@/lib/types';
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
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';


const SYSTEM_IDS = {
  newbie: 'bird-identifier-ai-newbie',
  twitcher: 'bird-identifier-ai-twitcher',
};

interface StagedContent extends PromptContent {
    publishedInBirdAI?: string[];
    publishedInAppAI?: string[];
}

// Helper to sort semantic versions (e.g., v1.10.2 > v1.2.3)
const sortSemanticVersions = (a: string | number, b: string | number) => {
    const aStr = String(a);
    const bStr = String(b);
    const aParts = aStr.startsWith('v') ? aStr.substring(1).split('.').map(Number) : [0,0,0];
    const bParts = bStr.startsWith('v') ? bStr.substring(1).split('.').map(Number) : [0,0,0];

    for(let i = 0; i < 3; i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;
        if(aPart !== bPart) return bPart - aPart;
    }
    return 0;
};


export default function BirdIdentifierPromptEditorPage() {
  const [selectedMode, setSelectedMode] = useState<'newbie' | 'twitcher'>('newbie');
  
  // All versions of this AI system (e.g., all of bird-identifier-ai-newbie-vX.Y.Z)
  const [birdAIVersions, setBirdAIVersions] = useState<PromptVersion[]>([]);
  // All versions of the global App AI
  const [appAIVersions, setAppAIVersions] = useState<AppAIVersion[]>([]);
  
  // All content pieces for the current system (e.g., all location_handling prompts)
  const [promptContents, setPromptContents] = useState<Record<string, StagedContent[]>>({});
  
  // The content versions selected in the main staging table
  const [stagedVersions, setStagedVersions] = useState<Record<string, string>>({});
  // Which categories are enabled in the staging table
  const [enabledCategories, setEnabledCategories] = useState<Record<string, boolean>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  
  // For the bottom editor section
  const [selectedCategoryForEditing, setSelectedCategoryForEditing] = useState<string>('');
  const [newPromptText, setNewPromptText] = useState('');
  
  const [publishVersionType, setPublishVersionType] = useState<'minor' | 'major' | 'patch'>('patch');
  const [contentPublishVersionType, setContentPublishVersionType] = useState<'patch' | 'minor' | 'major'>('patch');
  const [isEditLoaded, setIsEditLoaded] = useState(false);

  // States for cascading dropdowns in version history
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [selectedMinor, setSelectedMinor] = useState<string | null>(null);
  const [selectedPatch, setSelectedPatch] = useState<string | null>(null);

  
  const { toast } = useToast();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  const systemId = useMemo(() => SYSTEM_IDS[selectedMode], [selectedMode]);
  const activeBirdAIVersion = useMemo(() => birdAIVersions.sort((a,b) => sortSemanticVersions(a.version, b.version))[0], [birdAIVersions]);

  const fetchPromptData = useCallback(async () => {
    if (!isDevMode) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
        // Fetch all versions for this AI system
        const birdAIQuery = query(collection(db, 'prompt_versions'), where('systemId', '==', systemId));
        const birdAISnap = await getDocs(birdAIQuery);
        const fetchedBirdAIVersions = birdAISnap.docs.map(d => ({ id: d.id, ...d.data() } as PromptVersion));
        setBirdAIVersions(fetchedBirdAIVersions);

        // Fetch all App AI versions
        const appAIQuery = query(collection(db, 'app_ai_versions'));
        const appAISnap = await getDocs(appAIQuery);
        const fetchedAppAIVersions = appAISnap.docs.map(d => ({ id: d.id, ...d.data() } as AppAIVersion));
        setAppAIVersions(fetchedAppAIVersions);

        // Fetch all content for this system
        const contentQuery = query(collection(db, 'prompt_content'), where('systemId', '==', systemId));
        const contentSnapshot = await getDocs(contentQuery);
        const contents = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StagedContent));

        // Pre-calculate where each content piece was published
        contents.forEach(content => {
            content.publishedInBirdAI = fetchedBirdAIVersions
                .filter(v => Object.values(v.composedPrompts).includes(content.id))
                .map(v => v.version);
            content.publishedInAppAI = fetchedAppAIVersions
                .filter(appV => {
                    const birdAIVersionId = appV.systems[systemId];
                    const birdAIVersion = fetchedBirdAIVersions.find(bav => bav.id === birdAIVersionId);
                    return birdAIVersion && Object.values(birdAIVersion.composedPrompts).includes(content.id);
                })
                .map(v => v.version);
        });

        const contentsByCategory = contents.reduce((acc, content) => {
            const category = content.categoryId;
            if (!acc[category]) acc[category] = [];
            acc[category].push(content);
            return acc;
        }, {} as Record<string, StagedContent[]>);

        const allCategories = Array.from(new Set(Object.keys(contentsByCategory))).sort();
      
        const latestBirdAIVersion = fetchedBirdAIVersions.sort((a,b) => sortSemanticVersions(a.version, b.version))[0];

        // Set up the staging table based on the latest version
        let initialStaged: Record<string, string> = {};
        let initialEnabled: Record<string, boolean> = {};

        if (latestBirdAIVersion) {
            initialStaged = { ...latestBirdAIVersion.composedPrompts };
            allCategories.forEach(cat => {
                initialEnabled[cat] = !!initialStaged[cat];
            });
        }
        
        // Ensure all categories are represented, defaulting to latest published content if not in active version
        allCategories.forEach(cat => {
            if (!initialStaged[cat]) {
                const latestPublished = contentsByCategory[cat]?.filter(c => c.version !== 'v0.0.0-draft').sort((a,b) => sortSemanticVersions(a.version, b.version))[0];
                if (latestPublished) {
                    initialStaged[cat] = latestPublished.id;
                }
            }
        });

        setStagedVersions(initialStaged);
        setEnabledCategories(initialEnabled);

        if (allCategories.length > 0 && (!selectedCategoryForEditing || !allCategories.includes(selectedCategoryForEditing))) {
            setSelectedCategoryForEditing(allCategories[0]);
        } else if (allCategories.length === 0) {
            setSelectedCategoryForEditing('');
        }

        setPromptContents(contentsByCategory);

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
  }, [isDevMode, systemId, toast, selectedCategoryForEditing]);

  useEffect(() => {
    fetchPromptData();
  }, [fetchPromptData]);

  // Editor-related memos and effects
  const editorCategoryHistory = useMemo(() => {
    return (promptContents[selectedCategoryForEditing] || []).sort((a, b) => {
        if (String(a.version).includes('draft')) return -1;
        if (String(b.version).includes('draft')) return 1;
        return sortSemanticVersions(a.version, b.version);
    });
  }, [promptContents, selectedCategoryForEditing]);

  const editorDraftContent = useMemo(() => editorCategoryHistory.find(c => String(c.version).includes('draft')), [editorCategoryHistory]);

  const { majorVersions, minorVersions, patchVersions } = useMemo(() => {
      const published = editorCategoryHistory.filter(v => v.version !== 'v0.0.0-draft');
      const major = [...new Set(published.map(v => v.version.split('.')[0].replace('v','')))].sort((a,b) => Number(a) - Number(b));
      
      let minor: string[] = [];
      if (selectedMajor) {
          minor = [...new Set(published.filter(v => v.version.startsWith(`v${selectedMajor}.`)).map(v => v.version.split('.')[1]))].sort((a,b) => Number(a) - Number(b));
      }

      let patch: string[] = [];
      if (selectedMajor && selectedMinor) {
          patch = [...new Set(published.filter(v => v.version.startsWith(`v${selectedMajor}.${selectedMinor}.`)).map(v => v.version.split('.')[2]))].sort((a,b) => Number(a) - Number(b));
      }
      
      return { majorVersions: major, minorVersions: minor, patchVersions: patch };
  }, [editorCategoryHistory, selectedMajor, selectedMinor]);


  const editorCurrentContent = useMemo(() => {
      if (selectedMajor === '0') {
          return editorDraftContent;
      }
      if (selectedMajor && selectedMinor && selectedPatch) {
          const versionString = `v${selectedMajor}.${selectedMinor}.${selectedPatch}`;
          return editorCategoryHistory.find(c => c.version === versionString);
      }
      return undefined;
  }, [editorCategoryHistory, selectedMajor, selectedMinor, selectedPatch, editorDraftContent]);
  
  
  useEffect(() => {
      setNewPromptText('');
      setIsEditLoaded(false);
      setSelectedMajor(null);
      setSelectedMinor(null);
      setSelectedPatch(null);
  }, [selectedMode, selectedCategoryForEditing]);

  const handleSaveDraft = async () => {
    if (!selectedCategoryForEditing) return;
    setIsSaving(true);
    try {
        await savePromptContent({
            systemId,
            categoryId: selectedCategoryForEditing,
            promptText: newPromptText,
            isDraft: true,
        });

        toast({ title: 'Draft Saved', description: 'Your changes have been saved.' });
        setNewPromptText('');
        await fetchPromptData();

    } catch (error) {
        console.error("Failed to save draft:", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save draft.' });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handlePublishContentFromDraft = async () => {
    if (!isEditLoaded || !editorCurrentContent) {
        toast({ variant: 'destructive', title: 'Publish Failed', description: 'No previous version loaded to create a successor from.'});
        return;
    }
    setIsSaving(true);
    try {
        const newContent = await savePromptContent({
            systemId,
            categoryId: selectedCategoryForEditing,
            promptText: newPromptText,
            versionType: contentPublishVersionType,
            isDraft: false,
        });
        await fetchPromptData();
        toast({ title: 'Content Published!', description: `Created version ${newContent.version} for '${selectedCategoryForEditing}'.` });
        setNewPromptText('');
        setIsEditLoaded(false);
    } catch(e) {
        console.error("Failed to publish content:", e);
        toast({ variant: 'destructive', title: 'Publish Failed' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleEditVersion = () => {
    if (!editorCurrentContent) return;
    setNewPromptText(editorCurrentContent.promptText);
    setIsEditLoaded(true);
    toast({
        title: 'Version Loaded for Editing',
        description: `Version ${editorCurrentContent.version.includes('draft') ? 'Draft' : editorCurrentContent.version} text has been loaded into the editor.`,
    });
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName) return;
    const categoryId = newCategoryName.trim().toLowerCase().replace(/\s+/g, '_');
    if (Object.keys(promptContents).includes(categoryId)) {
      toast({ variant: 'destructive', title: 'Category Exists' });
      return;
    }
    setPromptContents(prev => ({ ...prev, [categoryId]: [] }));
    setEnabledCategories(prev => ({...prev, [categoryId]: true }));
    setSelectedCategoryForEditing(categoryId);
    setNewCategoryName('');
    setIsNewCategoryDialogOpen(false);
    setNewPromptText('');
  };
  
  const handlePublishBirdAI = async () => {
      setIsPublishing(true);
      try {
          const promptsToPublish = Object.entries(stagedVersions)
              .filter(([catId, _]) => enabledCategories[catId])
              .reduce((acc, [catId, contentId]) => {
                  acc[catId] = contentId;
                  return acc;
              }, {} as Record<string, string>);

          if (Object.keys(promptsToPublish).length === 0) {
              toast({ variant: 'destructive', title: 'Publish Error', description: 'Cannot publish a version with no enabled prompt categories.' });
              setIsPublishing(false);
              return;
          }

          const newVersion = await publishNewPromptVersion({
              systemId: systemId,
              composedPrompts: promptsToPublish,
              versionType: publishVersionType,
          });

          await fetchPromptData();
          toast({ title: 'Published!', description: `Successfully published version ${newVersion.version} for the ${selectedMode} AI.` });

      } catch (error) {
        console.error('Failed to publish new version:', error);
        toast({ variant: 'destructive', title: 'Publish Failed' });
      } finally {
        setIsPublishing(false);
      }
  };

  const handleMajorSelect = (value: string) => {
    setSelectedMajor(value);
    setSelectedMinor(null);
    setSelectedPatch(null);
  };
  const handleMinorSelect = (value: string) => {
    setSelectedMinor(value);
    setSelectedPatch(null);
  };

  if (!isDevMode) {
    return <p className="p-4">This page is only available in developer mode.</p>;
  }

  const hasUnsavedChanges = newPromptText.trim() !== '';
  const canSaveDraft = hasUnsavedChanges && !isSaving && !isEditLoaded;
  const canPublishContent = hasUnsavedChanges && isEditLoaded && !isSaving;

  return (
    <div className="container mx-auto px-4 py-8">
       <div className="flex items-center justify-center relative mb-4">
            <Button variant="ghost" size="icon" className="absolute left-0" asChild>
                <Link href="/settings/prompts">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
            </Button>
            <div className="text-center">
                <PageTitle>Bird Identifier AI Editor</PageTitle>
                <p className="max-w-2xl mx-auto text-muted-foreground mt-4">
                Select a mode, stage the desired prompt versions for each category in the table, then publish a new version of the AI. Use the editor below to create new prompt versions.
                </p>
            </div>
      </div>

      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex flex-col gap-2">
                <CardTitle>AI Mode</CardTitle>
                <CardDescription>Select the AI mode you want to configure prompts for.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Select value={selectedMode} onValueChange={(v) => setSelectedMode(v as 'newbie' | 'twitcher')}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a mode..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newbie">Newbie Mode</SelectItem>
                        <SelectItem value="twitcher">Twitcher Mode</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={publishVersionType} onValueChange={(v) => setPublishVersionType(v as 'minor' | 'major' | 'patch')}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="patch">Patch</SelectItem>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handlePublishBirdAI} disabled={isPublishing || isLoading}>
                    {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    Publish
                </Button>
            </div>
        </CardHeader>
      </Card>
      
      <Card className="mt-8">
        <CardHeader>
            <CardTitle>Active Prompt Configuration</CardTitle>
            <CardDescription>
                This is the configuration that will be used for the next publish. The current live version for the <strong>{selectedMode}</strong> AI is <strong>{activeBirdAIVersion?.version || 'N/A'}</strong>.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Category</TableHead>
                            <TableHead className="w-[250px]">Selected Version</TableHead>
                            <TableHead>Published In (Bird AI)</TableHead>
                            <TableHead>Published In (App AI)</TableHead>
                            <TableHead className="text-right">Enabled</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.keys(promptContents).sort().map(catId => {
                            const availableContent = promptContents[catId].filter(c => !String(c.version).includes('draft')).sort((a,b) => sortSemanticVersions(a.version, b.version));
                            const selectedContentId = stagedVersions[catId];
                            const selectedContent = promptContents[catId].find(c => c.id === selectedContentId);
                            
                            return (
                                <TableRow key={catId}>
                                    <TableCell className="font-medium capitalize">{catId.replace(/_/g, ' ')}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={selectedContentId}
                                            onValueChange={(id) => setStagedVersions(prev => ({...prev, [catId]: id}))}
                                            disabled={availableContent.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a version..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableContent.map(c => <SelectItem key={c.id} value={c.id}>{c.version}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedContent?.publishedInBirdAI?.map(v => <Badge key={v} variant="outline">{v}</Badge>) ?? <Badge variant="secondary">None</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedContent?.publishedInAppAI?.map(v => <Badge key={v} variant="secondary">{v}</Badge>) ?? <Badge variant="secondary">None</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Switch
                                            checked={enabledCategories[catId] || false}
                                            onCheckedChange={(checked) => setEnabledCategories(prev => ({ ...prev, [catId]: checked }))}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      <div className="mt-8 w-full">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Prompt Category Editor</CardTitle>
                <div className="flex items-center gap-2">
                    <Select value={selectedCategoryForEditing} onValueChange={setSelectedCategoryForEditing}>
                        <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select a category to edit..." />
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
                            Create a new component for the AI's prompt. Use a short, descriptive name (e.g., 'audio_analysis_rules').
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
            </CardHeader>
          </Card>
      </div>
      
      <div className="mt-8 flex flex-col md:flex-row gap-6">
        {isLoading ? (
            <div className="flex justify-center items-center p-8 w-full"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <>
            <Card className="flex-1">
               <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold leading-none tracking-tight">Version History</CardTitle>
                <div className="flex items-center justify-center gap-2 pt-2">
                    <Select value={selectedMajor || ''} onValueChange={handleMajorSelect} disabled={editorCategoryHistory.length === 0}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Major" />
                        </SelectTrigger>
                        <SelectContent>
                             {editorDraftContent && <SelectItem value="0">Draft</SelectItem>}
                             {majorVersions.map(v => <SelectItem key={v} value={v}>v{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedMinor || ''} onValueChange={handleMinorSelect} disabled={!selectedMajor || selectedMajor === '0' || minorVersions.length === 0}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Minor" />
                        </SelectTrigger>
                        <SelectContent>
                            {minorVersions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedPatch || ''} onValueChange={setSelectedPatch} disabled={!selectedMinor || selectedMajor === '0' || patchVersions.length === 0}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Patch" />
                        </SelectTrigger>
                        <SelectContent>
                             {patchVersions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleEditVersion} variant="outline" size="sm" disabled={!editorCurrentContent}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editorCurrentContent?.promptText || ''}
                  readOnly
                  className="min-h-[300px] font-mono text-sm bg-muted"
                  placeholder="Select a version to view its content."
                />
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="text-center">
                 <CardTitle className="text-2xl font-semibold leading-none tracking-tight">New/Edit Prompt Text</CardTitle>
                 <CardDescription>Make changes here. Save as a new draft, or publish as a new version if you've loaded an existing one to edit.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="new-prompt-text"
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Write new prompt content here, or load a version to use as a template."
                  disabled={!selectedCategoryForEditing}
                />
              </CardContent>
              <CardFooter className="flex-col items-start gap-4">
                 <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                 <div className="inline-block">
                                    <Button onClick={handleSaveDraft} disabled={!canSaveDraft}>
                                        {isSaving && !isEditLoaded ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save Draft
                                    </Button>
                                 </div>
                            </TooltipTrigger>
                            {!canSaveDraft && <TooltipContent><p>Type new content to save a draft. Cannot save draft when in edit mode.</p></TooltipContent>}
                        </Tooltip>
                    </TooltipProvider>

                    <Select value={contentPublishVersionType} onValueChange={(v) => setContentPublishVersionType(v as 'patch' | 'minor' | 'major')} disabled={!isEditLoaded}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="patch">Patch</SelectItem>
                            <SelectItem value="minor">Minor</SelectItem>
                            <SelectItem value="major">Major</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="inline-block">
                                    <Button onClick={handlePublishContentFromDraft} disabled={!canPublishContent}>
                                        {isSaving && isEditLoaded ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                                        Publish as New Version
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {!canPublishContent && <TooltipContent><p>Load a version, make edits, and then publish a new version.</p></TooltipContent>}
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

