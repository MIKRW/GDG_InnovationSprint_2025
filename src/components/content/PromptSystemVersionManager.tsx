
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
import { getPromptSystems, getPromptContentForSystem, publishNewPromptVersion, getPromptVersionsForSystem, setLivePromptSystemVersion } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';

interface ContentSelection {
  [categoryId: string]: string; // e.g., { base_instruction: 'base_instruction_v2' }
}

interface SystemWithContent extends PromptSystem {
  contentByCategory: Map<string, PromptContent[]>;
  versions: PromptVersion[];
}

export function PromptSystemVersionManager() {
  const [systems, setSystems] = useState<SystemWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<ContentSelection>({});
  const { toast } = useToast();

  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [saveType, setSaveType] = useState<'major' | 'minor' | 'patch'>('patch');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null);
  const [isRepublishing, setIsRepublishing] = useState(false);


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedSystems = await getPromptSystems();
      const systemsWithContent: SystemWithContent[] = await Promise.all(
        fetchedSystems.map(async (system) => {
          const [content, versions] = await Promise.all([
            getPromptContentForSystem(system.id),
            getPromptVersionsForSystem(system.id),
          ]);
          
          const contentByCategory = new Map<string, PromptContent[]>();
          content.forEach(c => {
            if (!contentByCategory.has(c.categoryId)) {
              contentByCategory.set(c.categoryId, []);
            }
            contentByCategory.get(c.categoryId)!.push(c);
          });

          // Make sure versions are sorted correctly
          versions.sort((a, b) => {
            if (typeof a.version !== 'string' || typeof b.version !== 'string') return 0;
            const verA = a.version.replace('v', '').split('.').map(Number);
            const verB = b.version.replace('v', '').split('.').map(Number);
            if (verA[0] !== verB[0]) return verB[0] - verA[0];
            if (verA[1] !== verB[1]) return verB[1] - verA[1];
            return verB[2] - verA[2];
          });


          return { ...system, contentByCategory, versions };
        })
      );
      setSystems(systemsWithContent);
      if (systemsWithContent.length > 0 && !selectedSystemId) {
        setSelectedSystemId(systemsWithContent[0].id);
      }
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
  }, [toast, selectedSystemId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedSystem = useMemo(() => {
    return systems.find(s => s.id === selectedSystemId);
  }, [systems, selectedSystemId]);

  useEffect(() => {
    setSelections({});
    setViewingVersionId(null);
    setIsRepublishing(false);
  }, [selectedSystemId]);

  useEffect(() => {
    if (viewingVersionId && selectedSystem) {
        const version = selectedSystem.versions.find(v => v.id === viewingVersionId);
        if (version) {
            setSelections(version.composedPrompts);
        }
    } else {
        setSelections({});
        setIsRepublishing(false); // Can't republish when composing new
    }
  }, [viewingVersionId, selectedSystem]);


  const handleSelection = (categoryId: string, contentId: string) => {
    setSelections(prev => ({ ...prev, [categoryId]: contentId }));
  };

  const handlePublish = async () => {
    if (!selectedSystem) {
        toast({ variant: 'destructive', title: 'Error', description: 'No system selected.' });
        return;
    }

    setIsSubmitting(true);
    try {
        if (isRepublishing) {
            if (!viewingVersionId) {
                toast({ variant: 'destructive', title: 'Action not allowed', description: 'Cannot re-publish a new, un-saved version.' });
                return;
            }
            const versionToRepublish = selectedSystem.versions.find(v => v.id === viewingVersionId);
            if (!versionToRepublish) return;

            await setLivePromptSystemVersion(selectedSystem.id, versionToRepublish.version);
            
            toast({ title: 'Success!', description: `Version ${versionToRepublish.version} is now the active version for ${selectedSystem.name}.` });
        } else {
             if (!nextVersionString) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not determine next version number.' });
                return;
            }
            if (Array.from(selectedSystem.contentByCategory.keys()).length !== Object.keys(selections).length) {
                toast({ variant: 'destructive', title: 'Incomplete Selection', description: 'Please select a prompt content version for every category.' });
                return;
            }
            
            const newVersion = await publishNewPromptVersion(selectedSystem.id, nextVersionString, selections);
            toast({ title: 'Published!', description: `Prompt System Version ${newVersion.version} for ${selectedSystem.name} is now available.` });
        }

        await fetchData(); // Refresh all data
        setSelections({});
        setViewingVersionId(null);

    } catch (error) {
        console.error('Failed to publish prompt version:', error);
        toast({ variant: 'destructive', title: 'Publish Failed', description: 'Could not save the new prompt version.' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleViewVersionChange = (value: string) => {
    if (value === 'compose-new') {
      setViewingVersionId(null);
    } else {
      setViewingVersionId(value);
    }
  };

  const nextVersionString = useMemo(() => {
    if (!selectedSystem) return "v1.0.0";
    const latestVersion = selectedSystem.versions[0]; // Assumes versions are sorted desc
    if (!latestVersion) return "v1.0.0";

    const [major, minor, patch] = latestVersion.version.replace('v', '').split('.').map(Number);
    if (saveType === 'major') return `v${major + 1}.0.0`;
    if (saveType === 'minor') return `v${major}.${minor + 1}.0`;
    return `v${major}.${minor}.${patch + 1}`;
  }, [selectedSystem, saveType]);


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isViewingHistory = viewingVersionId !== null;

  return (
    <Card className="mt-8">
      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1" className="border-b-0">
          <AccordionTrigger className="p-6 hover:no-underline">
            <div className="text-left">
              <CardTitle>Prompt System Version Publisher</CardTitle>
              <CardDescription className="pt-2">
                Compose new versions of an AI system by selecting which version of each prompt category to include.
              </CardDescription>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-6 pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                        <Label htmlFor="system-selector" className="font-semibold whitespace-nowrap">AI System</Label>
                        <Select value={selectedSystemId || ''} onValueChange={setSelectedSystemId}>
                            <SelectTrigger id="system-selector" className="w-full sm:w-[250px]">
                                <SelectValue placeholder="Select a system" />
                            </SelectTrigger>
                            <SelectContent>
                                {systems.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-center gap-4">
                        <Label htmlFor="version-viewer" className="font-semibold whitespace-nowrap">View/Compose</Label>
                        <Select onValueChange={handleViewVersionChange} value={viewingVersionId || 'compose-new'}>
                            <SelectTrigger id="version-viewer" className="w-full sm:w-[250px]">
                                <SelectValue placeholder="Compose New..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="compose-new">Compose New...</SelectItem>
                                {selectedSystem?.versions.map(v => (
                                    <SelectItem key={v.id} value={v.id}>
                                      Version {v.version} {selectedSystem.activeVersion === v.version && '(Active)'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <CardContent>
              {selectedSystem ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Prompt Category</TableHead>
                      <TableHead>Content Version</TableHead>
                      <TableHead className="text-right">Live In</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(selectedSystem.contentByCategory.entries()).map(([category, contents]) => (
                      <TableRow key={category}>
                        <TableCell className="font-medium capitalize">{category.replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <Select 
                            value={selections[category] || ''} 
                            onValueChange={(value) => handleSelection(category, value)}
                            disabled={isViewingHistory}
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
                           {selectedSystem.activeVersion}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center p-8">Select an AI System to begin.</p>
              )}
            </CardContent>

            {selectedSystem && (
                <CardFooter className="border-t pt-6">
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center space-x-2">
                           <Switch id="republish-switch" checked={isRepublishing} onCheckedChange={setIsRepublishing} disabled={!isViewingHistory} />
                           <Label htmlFor="republish-switch">Republish Selected</Label>
                        </div>
                        <div className="flex items-center gap-8" style={{ opacity: isRepublishing ? 0.5 : 1 }}>
                            <div className="space-y-2">
                                <Label>New Version Type</Label>
                                <RadioGroup
                                    defaultValue="patch"
                                    className="flex gap-4"
                                    onValueChange={(v) => setSaveType(v as any)}
                                    disabled={isRepublishing || isViewingHistory}
                                >
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="major" id="sys-major" /><Label htmlFor="sys-major">Major</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="minor" id="sys-minor" /><Label htmlFor="sys-minor">Minor</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="patch" id="sys-patch" /><Label htmlFor="sys-patch">Patch</Label></div>
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
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
