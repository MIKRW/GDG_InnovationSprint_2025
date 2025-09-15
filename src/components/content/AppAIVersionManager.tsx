
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import type { PromptSystem, PromptVersion, AppAIVersion } from '@/lib/types';
import { getPromptSystems, getPromptVersionsForSystem, getAppAIVersions, getAppAIConfig } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';

interface VersionSelection {
  [systemId: string]: {
    major: string;
    minor: string;
    patch: string;
    fullVersion: string;
  };
}

interface SystemWithVersions extends PromptSystem {
  versions: PromptVersion[];
  versionParts: {
    major: string[];
    minor: Map<string, string[]>;
    patch: Map<string, string[]>;
  };
}

export function AppAIVersionManager() {
  const [systems, setSystems] = useState<SystemWithVersions[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<VersionSelection>({});
  const { toast } = useToast();

  const [publishedVersions, setPublishedVersions] = useState<AppAIVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [selectedDisplayVersion, setSelectedDisplayVersion] = useState('new');
  const [saveType, setSaveType] = useState<'major' | 'minor' | 'patch'>('patch');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [fetchedSystems, fetchedVersions, config] = await Promise.all([
          getPromptSystems(),
          getAppAIVersions(),
          getAppAIConfig()
        ]);
        
        setActiveVersionId(config?.activeAppAIVersion || null);
        setPublishedVersions(fetchedVersions);

        const systemsWithVersions: SystemWithVersions[] = await Promise.all(
          fetchedSystems.map(async (system) => {
            const versions = await getPromptVersionsForSystem(system.id);
            const versionParts = {
              major: new Set<string>(),
              minor: new Map<string, Set<string>>(),
              patch: new Map<string, Set<string>>(),
            };

            versions.forEach((v) => {
              const [maj, min, pat] = v.version.split('.');
              versionParts.major.add(maj);

              if (!versionParts.minor.has(maj)) {
                versionParts.minor.set(maj, new Set());
              }
              versionParts.minor.get(maj)!.add(min);

              const minorKey = `${maj}.${min}`;
              if (!versionParts.patch.has(minorKey)) {
                versionParts.patch.set(minorKey, new Set());
              }
              versionParts.patch.get(minorKey)!.add(pat);
            });

            return {
              ...system,
              versions,
              versionParts: {
                major: Array.from(versionParts.major).sort(),
                minor: new Map(
                  Array.from(versionParts.minor.entries()).map(([k, v]) => [
                    k,
                    Array.from(v).sort(),
                  ])
                ),
                patch: new Map(
                  Array.from(versionParts.patch.entries()).map(([k, v]) => [
                    k,
                    Array.from(v).sort(),
                  ])
                ),
              },
            };
          })
        );
        setSystems(systemsWithVersions);
      } catch (error) {
        console.error('Failed to fetch AI systems:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load AI systems from Firestore.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  useEffect(() => {
    if (selectedDisplayVersion === 'new') {
        // Clear selections when switching to compose a new version
        setSelections({});
    } else {
        const versionToShow = publishedVersions.find(v => v.id === selectedDisplayVersion);
        if (versionToShow) {
            const newSelections: VersionSelection = {};
            for (const systemId in versionToShow.systems) {
                const fullVersion = versionToShow.systems[systemId];
                const [major, minor, patch] = fullVersion.split('.');
                newSelections[systemId] = { major, minor, patch, fullVersion };
            }
            setSelections(newSelections);
        }
    }
  }, [selectedDisplayVersion, publishedVersions]);


  const handleSelection = (
    systemId: string,
    part: 'major' | 'minor' | 'patch',
    value: string
  ) => {
    setSelections((prev) => {
      const newSelection = { ...(prev[systemId] || {}) };
      if (part === 'major') {
        newSelection.major = value;
        delete newSelection.minor;
        delete newSelection.patch;
      } else if (part === 'minor') {
        newSelection.minor = value;
        delete newSelection.patch;
      } else {
        newSelection.patch = value;
      }

      if (newSelection.major && newSelection.minor && newSelection.patch) {
          newSelection.fullVersion = `${newSelection.major}.${newSelection.minor}.${newSelection.patch}`;
      } else {
          delete newSelection.fullVersion;
      }

      return { ...prev, [systemId]: newSelection };
    });
  };

  const selectedSystem = (systemId: string) => selections[systemId] || {};
  const isViewingHistory = selectedDisplayVersion !== 'new';

  const activeVersion = useMemo(() => {
      return publishedVersions.find(v => v.id === activeVersionId);
  }, [publishedVersions, activeVersionId]);


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1" className="border-b-0">
          <AccordionTrigger className="p-6 hover:no-underline">
            <div className="text-left">
                <CardTitle>App AI Version Publisher</CardTitle>
                <CardDescription className="pt-2">
                    Compose a new App AI Version by selecting a specific version for each AI system. This combination will be published as a new global version for the application.
                </CardDescription>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-6 pb-6">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                        <Label htmlFor="version-selector" className="font-semibold whitespace-nowrap">View Version</Label>
                        <Select value={selectedDisplayVersion} onValueChange={setSelectedDisplayVersion}>
                            <SelectTrigger id="version-selector" className="w-full sm:w-[250px]">
                                <SelectValue placeholder="Select a version to view" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">Compose New Version</SelectItem>
                                <Separator />
                                {publishedVersions.map(v => (
                                    <SelectItem key={v.id} value={v.id}>
                                        Version {v.version} {v.id === activeVersionId && '(Live)'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="font-semibold whitespace-nowrap">Live Version:</Label>
                        {activeVersion ? (
                            <Badge variant="secondary" className="text-sm">
                                {activeVersion.version}
                            </Badge>
                        ) : (
                             <Badge variant="outline" className="text-sm">
                                None
                            </Badge>
                        )}
                    </div>
                 </div>
            </div>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">AI System</TableHead>
                    <TableHead>Major</TableHead>
                    <TableHead>Minor</TableHead>
                    <TableHead>Patch</TableHead>
                    <TableHead>Published In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systems.map((system) => (
                    <TableRow key={system.id}>
                      <TableCell className="font-medium">{system.name}</TableCell>
                      <TableCell>
                        <Select
                          onValueChange={(value) => handleSelection(system.id, 'major', value)}
                          value={selectedSystem(system.id).major}
                          disabled={isViewingHistory}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Major" />
                          </SelectTrigger>
                          <SelectContent>
                            {system.versionParts.major.map((maj) => (
                              <SelectItem key={maj} value={maj}>
                                v{maj}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          disabled={!selectedSystem(system.id).major || isViewingHistory}
                          onValueChange={(value) => handleSelection(system.id, 'minor', value)}
                          value={selectedSystem(system.id).minor}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Minor" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedSystem(system.id).major && system.versionParts.minor.get(selectedSystem(system.id).major)?.map((min) => (
                              <SelectItem key={min} value={min}>
                                {min}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          disabled={!selectedSystem(system.id).minor || isViewingHistory}
                          onValueChange={(value) => handleSelection(system.id, 'patch', value)}
                          value={selectedSystem(system.id).patch}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Patch" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedSystem(system.id).major && selectedSystem(system.id).minor &&
                              system.versionParts.patch.get(`${selectedSystem(system.id).major}.${selectedSystem(system.id).minor}`)?.map((pat) => (
                                <SelectItem key={pat} value={pat}>
                                  {pat}
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {/* Logic to show published history will go here */}
                        -
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
               {!isViewingHistory && (
                 <>
                    <div className="space-y-2">
                        <Label>New Version Type</Label>
                        <RadioGroup defaultValue="patch" className="flex gap-4" onValueChange={(v) => setSaveType(v as any)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="major" id="major" />
                                <Label htmlFor="major">Major</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="minor" id="minor" />
                                <Label htmlFor="minor">Minor</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="patch" id="patch" />
                                <Label htmlFor="patch">Patch</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <Button>Publish New App AI Version</Button>
                 </>
               )}
            </CardFooter>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
