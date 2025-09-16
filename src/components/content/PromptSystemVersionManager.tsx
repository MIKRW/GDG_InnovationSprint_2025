
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
import { publishNewPromptVersion, setLivePromptSystemVersion } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface ContentSelection {
    [categoryId: string]: {
      major?: string;
      minor?: string;
      patch?: string;
      contentId?: string; // e.g., base_instruction_v1-0-0
    };
}

interface PromptSystemVersionManagerProps {
    system: PromptSystem | null;
    versions: PromptVersion[];
    content: PromptContent[];
    onUpdate: () => void;
    isLoading: boolean;
}

export function PromptSystemVersionManager({ system, versions, content, onUpdate, isLoading }: PromptSystemVersionManagerProps) {
  const [selections, setSelections] = useState<ContentSelection>({});
  const { toast } = useToast();
  
  const [saveType, setSaveType] = useState<'major' | 'minor' | 'patch'>('patch');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingVersionId, setViewingVersionId] = useState<string>('compose-new');
  const [isRepublishing, setIsRepublishing] = useState(false);

  // Group content by category for easy lookup
  const { contentByCategory, contentVersionParts } = useMemo(() => {
    const categoryMap = new Map<string, PromptContent[]>();
    const partsMap = new Map<string, { major: Set<string>, minor: Map<string, Set<string>>, patch: Map<string, Set<string>> }>();

    content.forEach(c => {
        if (!categoryMap.has(c.categoryId)) {
            categoryMap.set(c.categoryId, []);
            partsMap.set(c.categoryId, {
                major: new Set(),
                minor: new Map(),
                patch: new Map(),
            });
        }
        categoryMap.get(c.categoryId)!.push(c);

        const categoryParts = partsMap.get(c.categoryId)!;
        const [maj, min, pat] = c.version.replace('v', '').split('.').map(part => part);
        
        categoryParts.major.add(maj);

        if (!categoryParts.minor.has(maj)) {
          categoryParts.minor.set(maj, new Set());
        }
        categoryParts.minor.get(maj)!.add(min);

        const minorKey = `${maj}.${min}`;
        if (!categoryParts.patch.has(minorKey)) {
          categoryParts.patch.set(minorKey, new Set());
        }
        categoryParts.patch.get(minorKey)!.add(pat);
    });

    const finalPartsMap = new Map<string, any>();
    for (const [category, parts] of partsMap.entries()) {
        finalPartsMap.set(category, {
            major: Array.from(parts.major).sort((a,b) => b.localeCompare(a, undefined, { numeric: true })),
            minor: new Map(Array.from(parts.minor.entries()).map(([k, v]) => [k, Array.from(v).sort((a,b) => b.localeCompare(a, undefined, { numeric: true }))])),
            patch: new Map(Array.from(parts.patch.entries()).map(([k, v]) => [k, Array.from(v).sort((a,b) => b.localeCompare(a, undefined, { numeric: true }))])),
        });
    }

    return { contentByCategory: categoryMap, contentVersionParts: finalPartsMap };
  }, [content]);


  // Reset selections when the system changes
  useEffect(() => {
    setSelections({});
    setViewingVersionId('compose-new');
    setIsRepublishing(false);
  }, [system]);

  const loadSelectionsFromVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
        const newSelections: ContentSelection = {};
        for(const categoryId in version.composedPrompts) {
            const contentId = version.composedPrompts[categoryId];
            const contentItem = content.find(c => c.id === contentId);
            if (contentItem) {
                const [major, minor, patch] = contentItem.version.replace('v','').split('.');
                newSelections[categoryId] = {
                    major, minor, patch, contentId
                }
            }
        }
        setSelections(newSelections);
    }
  }, [versions, content]);

  useEffect(() => {
    if (viewingVersionId && viewingVersionId !== 'compose-new') {
        loadSelectionsFromVersion(viewingVersionId);
        setIsRepublishing(true); // Default to republish when viewing history
    } else {
        setSelections({});
        setIsRepublishing(false);
    }
  }, [viewingVersionId, versions, loadSelectionsFromVersion]);
  
  useEffect(() => {
    // When user toggles republish back ON, reset any temporary changes
    if (isRepublishing && viewingVersionId !== 'compose-new') {
        loadSelectionsFromVersion(viewingVersionId);
    }
  }, [isRepublishing, viewingVersionId, loadSelectionsFromVersion]);


  const handleSelection = (categoryId: string, part: 'major' | 'minor' | 'patch', value: string) => {
    setSelections(prev => {
        const newCatSelection = { ...(prev[categoryId] || {}) };
        
        if (part === 'major') {
            newCatSelection.major = value;
            delete newCatSelection.minor;
            delete newCatSelection.patch;
        } else if (part === 'minor') {
            newCatSelection.minor = value;
            delete newCatSelection.patch;
        } else {
            newCatSelection.patch = value;
        }
        
        if (newCatSelection.major && newCatSelection.minor && newCatSelection.patch) {
            const versionString = `v${newCatSelection.major}.${newCatSelection.minor}.${newCatSelection.patch}`;
            const contentId = `${categoryId}_${versionString.replace(/\./g, '-')}`;
            newCatSelection.contentId = contentId;
        } else {
            delete newCatSelection.contentId;
        }

        return { ...prev, [categoryId]: newCatSelection };
    });
  };

  const handlePublish = async () => {
    if (!system) {
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
            const versionToRepublish = versions.find(v => v.id === viewingVersionId);
            if (!versionToRepublish) return;

            await setLivePromptSystemVersion(system.id, versionToRepublish.version);
            
            toast({ title: 'Success!', description: `Version ${versionToRepublish.version} is now the active version for ${system.name}.` });
        } else {
             if (!nextVersionString) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not determine next version number.' });
                return;
            }
            if (Array.from(contentByCategory.keys()).some(key => !selections[key]?.contentId)) {
                toast({ variant: 'destructive', title: 'Incomplete Selection', description: 'Please select a prompt content version for every category.' });
                return;
            }

            const finalComposedPrompts: { [categoryId: string]: string } = {};
            for(const categoryId in selections) {
                finalComposedPrompts[categoryId] = selections[categoryId].contentId!;
            }
            
            await publishNewPromptVersion(system.id, nextVersionString, finalComposedPrompts);
            toast({ title: 'Published!', description: `Prompt System Version ${nextVersionString} for ${system.name} is now available.` });
        }

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
    if (!system) return "v1.0.0";
    const latestVersion = versions[0]; // Assumes versions are sorted desc
    if (!latestVersion) return "v1.0.0";

    const [major, minor, patch] = latestVersion.version.replace('v', '').split('.').map(Number);
    if (saveType === 'major') return `v${major + 1}.0.0`;
    if (saveType === 'minor') return `v${major}.${minor + 1}.0`;
    return `v${major}.${minor}.${patch + 1}`;
  }, [system, versions, saveType]);


  if (isLoading) {
    return (
        <div className="mt-8">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
            <div className="space-y-4 mt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            </div>
            <div className="mt-4">
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
  }
  
  if (!system) {
    return (
        <div className="py-8 text-center text-muted-foreground">
            Please select an AI system above to manage its versions.
        </div>
    );
  }

  const isViewingHistory = viewingVersionId !== 'compose-new';
  const isCompositionDisabled = isViewingHistory && isRepublishing;


  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
      <AccordionItem value="item-1" className="border-b-0">
        <AccordionTrigger className="hover:no-underline p-0 h-36">
          <div className="flex-1 flex flex-col justify-between text-center p-6 h-full">
            <h3 className="text-2xl font-bold">AI Type Version Control</h3>
            <p className="text-sm text-muted-foreground px-4">
              Compose new versions of the{' '}
              <span className="font-semibold text-foreground">{system.name}</span>{' '}
              system by selecting which version of each prompt category to include.
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="border-t">
              <CardContent>
                  <div className="pt-6">
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
                                      {versions.map(v => (
                                          <SelectItem key={v.id} value={v.id}>
                                          Version {v.version} {system.activeVersion === v.version && '(Active)'}
                                          </SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                      </div>
                  </div>
                  <div>
                      <Table>
                      <TableHeader>
                          <TableRow>
                          <TableHead className="w-[200px]">Prompt Category</TableHead>
                          <TableHead>Major</TableHead>
                          <TableHead>Minor</TableHead>
                          <TableHead>Patch</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {Array.from(contentByCategory.keys()).map((category) => {
                          const selected = selections[category] || {};
                          const parts = contentVersionParts.get(category);

                          return (
                              <TableRow key={category}>
                                  <TableCell className="font-medium capitalize">{category.replace(/_/g, ' ')}</TableCell>
                                  <TableCell>
                                      <Select onValueChange={(value) => handleSelection(category, 'major', value)} value={selected.major} disabled={isCompositionDisabled}>
                                      <SelectTrigger><SelectValue placeholder="Select Major" /></SelectTrigger>
                                      <SelectContent>
                                          {parts?.major.map(v => <SelectItem key={v} value={v}>v{v}</SelectItem>)}
                                      </SelectContent>
                                      </Select>
                                  </TableCell>
                                  <TableCell>
                                      <Select onValueChange={(value) => handleSelection(category, 'minor', value)} value={selected.minor} disabled={!selected.major || isCompositionDisabled}>
                                      <SelectTrigger><SelectValue placeholder="Select Minor" /></SelectTrigger>
                                      <SelectContent>
                                          {selected.major && parts?.minor.get(selected.major)?.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                      </SelectContent>
                                      </Select>
                                  </TableCell>
                                  <TableCell>
                                      <Select onValueChange={(value) => handleSelection(category, 'patch', value)} value={selected.patch} disabled={!selected.minor || isCompositionDisabled}>
                                      <SelectTrigger><SelectValue placeholder="Select Patch" /></SelectTrigger>
                                      <SelectContent>
                                          {selected.major && selected.minor && parts?.patch.get(`${selected.major}.${selected.minor}`)?.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                      </SelectContent>
                                      </Select>
                                  </TableCell>
                              </TableRow>
                          )
                          })}
                      </TableBody>
                      </Table>
                  </div>
              </CardContent>
              <CardFooter className="border-t pt-6 mt-6">
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
            </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
