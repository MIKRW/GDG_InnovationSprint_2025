
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { PromptSystem, PromptContent, PromptVersion } from '@/lib/types';
import { getPromptContentForSystem, publishNewPromptVersion, getPromptVersionsForSystem, setLivePromptSystemVersion, getPromptSystems } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';

interface ContentSelection {
  [categoryId: string]: string; // e.g., { base_instruction: 'base_instruction_v2' }
}

interface SystemWithContent extends PromptSystem {
  contentByCategory: Map<string, PromptContent[]>;
  versions: PromptVersion[];
}

interface PromptSystemVersionManagerProps {
    systemId: string | null;
    onUpdate: () => void;
}

export function PromptSystemVersionManager({ systemId, onUpdate }: PromptSystemVersionManagerProps) {
  const [selectedSystem, setSelectedSystem] = useState<SystemWithContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<ContentSelection>({});
  const { toast } = useToast();
  
  const [saveType, setSaveType] = useState<'major' | 'minor' | 'patch'>('patch');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingVersionId, setViewingVersionId] = useState<string>('compose-new');
  const [isRepublishing, setIsRepublishing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!systemId) {
      setLoading(false);
      setSelectedSystem(null);
      return;
    }
    setLoading(true);
    try {
        const [allSystems, content, versions] = await Promise.all([
            getPromptSystems(), // We still need this to get the system's name and active version
            getPromptContentForSystem(systemId),
            getPromptVersionsForSystem(systemId),
        ]);

        const currentSystem = allSystems.find(s => s.id === systemId);
        if (!currentSystem) {
            throw new Error(`System with ID ${systemId} not found.`);
        }
        
        const contentByCategory = new Map<string, PromptContent[]>();
        content.forEach(c => {
            if (!contentByCategory.has(c.categoryId)) {
                contentByCategory.set(c.categoryId, []);
            }
            contentByCategory.get(c.categoryId)!.push(c);
        });

        setSelectedSystem({ ...currentSystem, contentByCategory, versions });
    } catch (error) {
      console.error('Failed to fetch prompt system data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load prompt system data from Firestore.',
      });
    } finally {
      setLoading(false);
    }
  }, [systemId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset selections when the system changes
  useEffect(() => {
    setSelections({});
    setViewingVersionId('compose-new');
    setIsRepublishing(false);
  }, [systemId]);

  const selectedSystemMemo = useMemo(() => {
    return selectedSystem;
  }, [selectedSystem]);

  useEffect(() => {
    if (viewingVersionId && viewingVersionId !== 'compose-new' && selectedSystemMemo) {
        const version = selectedSystemMemo.versions.find(v => v.id === viewingVersionId);
        if (version) {
            setSelections(version.composedPrompts);
            setIsRepublishing(true); // Default to republish when viewing history
        }
    } else {
        setSelections({});
        setIsRepublishing(false);
    }
  }, [viewingVersionId, selectedSystemMemo]);


  const handleSelection = (categoryId: string, contentId: string) => {
    setSelections(prev => ({ ...prev, [categoryId]: contentId }));
  };

  const handlePublish = async () => {
    if (!selectedSystemMemo) {
        toast({ variant: 'destructive', title: 'Error', description: 'No system selected.' });
        return;
    }

    setIsSubmitting(true);
    try {
        if (isRepublishing) {
            if (!viewingVersionId || viewingVersionId === 'compose-new') {
                toast({ variant: 'destructive', title: 'Action not allowed', description: 'Cannot re-publish a new, un-saved version.' });
                return;
            }
            const versionToRepublish = selectedSystemMemo.versions.find(v => v.id === viewingVersionId);
            if (!versionToRepublish) return;

            await setLivePromptSystemVersion(selectedSystemMemo.id, versionToRepublish.version);
            
            toast({ title: 'Success!', description: `Version ${versionToRepublish.version} is now the active version for ${selectedSystemMemo.name}.` });
        } else {
             if (!nextVersionString) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not determine next version number.' });
                return;
            }
            if (Array.from(selectedSystemMemo.contentByCategory.keys()).some(key => !selections[key])) {
                toast({ variant: 'destructive', title: 'Incomplete Selection', description: 'Please select a prompt content version for every category.' });
                return;
            }
            
            const newVersion = await publishNewPromptVersion(selectedSystemMemo.id, nextVersionString, selections);
            toast({ title: 'Published!', description: `Prompt System Version ${newVersion.version} for ${selectedSystemMemo.name} is now available.` });
        }

        await fetchData(); // Refresh all data for this component
        onUpdate(); // Trigger parent page to refetch all systems data
        setSelections({});
        setViewingVersionId('compose-new');

    } catch (error) {
        console.error('Failed to publish prompt version:', error);
        toast({ variant: 'destructive', title: 'Publish Failed', description: 'Could not save the new prompt version.' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleViewVersionChange = (value: string) => {
    setViewingVersionId(value);
  };

  const nextVersionString = useMemo(() => {
    if (!selectedSystemMemo) return "v1.0.0";
    const latestVersion = selectedSystemMemo.versions[0]; // Assumes versions are sorted desc
    if (!latestVersion) return "v1.0.0";

    const [major, minor, patch] = latestVersion.version.replace('v', '').split('.').map(Number);
    if (saveType === 'major') return `v${major + 1}.0.0`;
    if (saveType === 'minor') return `v${major}.${minor + 1}.0`;
    return `v${major}.${minor}.${patch + 1}`;
  }, [selectedSystemMemo, saveType]);


  if (loading) {
    return (
      <Card>
        <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
         <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }
  
  if (!systemId || !selectedSystemMemo) {
    return (
       <Card>
          <CardHeader>
            <CardTitle>No System Selected</CardTitle>
            <CardDescription>Please select an AI system above to manage its versions.</CardDescription>
          </CardHeader>
       </Card>
    );
  }

  const isViewingHistory = viewingVersionId !== 'compose-new';
  const isCompositionDisabled = isViewingHistory && isRepublishing;


  return (
    <Card>
      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1" className="border-b-0">
          <AccordionTrigger className="p-6 hover:no-underline">
            <div className="flex-1 text-center">
              <CardTitle>AI type version control</CardTitle>
              <CardDescription className="pt-2">
                Compose new versions of the <span className="font-semibold text-foreground">{selectedSystemMemo.name}</span> system by selecting which version of each prompt category to include.
              </CardDescription>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-6 pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                     <div className="flex items-center gap-4">
                        <Label htmlFor="version-viewer" className="font-semibold whitespace-nowrap">View/Compose</Label>
                        <Select onValueChange={handleViewVersionChange} value={viewingVersionId || 'compose-new'}>
                            <SelectTrigger id="version-viewer" className="w-full sm:w-[250px]">
                                <SelectValue placeholder="Compose New..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="compose-new">Compose New...</SelectItem>
                                <Separator/>
                                {selectedSystemMemo.versions.map(v => (
                                    <SelectItem key={v.id} value={v.id}>
                                      Version {v.version} {selectedSystemMemo.activeVersion === v.version && '(Active)'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Prompt Category</TableHead>
                      <TableHead>Content Version</TableHead>
                      <TableHead className="text-right">Live In</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(selectedSystemMemo.contentByCategory.keys()).map((category) => {
                      const contents = selectedSystemMemo.contentByCategory.get(category) || [];
                      return (
                          <TableRow key={category}>
                            <TableCell className="font-medium capitalize">{category.replace(/_/g, ' ')}</TableCell>
                            <TableCell>
                              <Select 
                                value={selections[category] || ''} 
                                onValueChange={(value) => handleSelection(category, value)}
                                disabled={isCompositionDisabled}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select content version" />
                                </SelectTrigger>
                                <SelectContent>
                                  {contents.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.version} - {new Date(c.timestamp).toLocaleDateString()}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-xs">
                              {selectedSystemMemo.activeVersion}
                            </TableCell>
                          </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
            </CardContent>

            <CardFooter className="border-t pt-6">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center space-x-2">
                        <Switch id="sys-republish-switch" checked={isRepublishing} onCheckedChange={setIsRepublishing} disabled={!isViewingHistory} />
                        <Label htmlFor="sys-republish-switch">Republish Selected</Label>
                    </div>
                    <div className="flex items-center gap-8" style={{ opacity: isRepublishing ? 0.5 : 1 }}>
                        <div className="space-y-2">
                            <Label>New Version Type</Label>
                            <RadioGroup
                                defaultValue="patch"
                                className="flex gap-4"
                                onValueChange={(v) => setSaveType(v as any)}
                                disabled={isRepublishing}
                            >
                                <div className="flex items-center space-x-2"><RadioGroupItem value="major" id="sys-major" disabled={isRepublishing}/><Label htmlFor="sys-major">Major</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="minor" id="sys-minor" disabled={isRepublishing}/><Label htmlFor="sys-minor">Minor</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="patch" id="sys-patch" disabled={isRepublishing}/><Label htmlFor="sys-patch">Patch</Label></div>
                            </RadioGroup>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-muted-foreground">Next Version:</Label>
                            <Badge variant="outline">{nextVersionString}</Badge>
                        </div>
                    </div>
                    <Button onClick={handlePublish} disabled={isSubmitting || (isViewingHistory && !isRepublishing)}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Publish
                    </Button>
                </div>
            </CardFooter>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
