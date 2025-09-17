
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
import { ChevronDown, Loader2 } from 'lucide-react';
import type { PromptSystem, AppAIVersion } from '@/lib/types';
import { getPromptSystems, getPromptVersionsForSystem, getAppAIVersions, getAppAIConfig, publishNewAppAIVersion, promoteDevelopmentVersionToLive } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';


interface VersionSelection {
  [systemId: string]: string; // e.g., { 'bird-identifier-ai-newbie': 'v1.1.0' }
}

interface EnabledSystems {
    [systemId: string]: boolean;
}

interface SystemWithVersion extends PromptSystem {
  liveVersions: string[];
  devVersions: string[];
}

function VersionPublisher({
  title,
  description,
  systems,
  publishedVersions,
  activeVersionId,
  saveType,
  onSaveTypeChange,
  nextVersionString,
  onPublish,
  isLoading,
  isLive,
  isCollapsible,
  onPromote,
}: {
  title: string;
  description: string;
  systems: SystemWithVersion[];
  publishedVersions: AppAIVersion[];
  activeVersionId: string | null;
  saveType: 'major' | 'minor' | 'patch';
  onSaveTypeChange: (type: 'major' | 'minor' | 'patch') => void;
  nextVersionString: string;
  onPublish: (selections: VersionSelection, version: string, enabledSystems: EnabledSystems) => void;
  isLoading: boolean;
  isLive?: boolean;
  isCollapsible?: boolean;
  onPromote?: (versionId: string, type: 'major' | 'minor' | 'patch') => void;
}) {
  const [selections, setSelections] = useState<VersionSelection>({});
  const [enabledSystems, setEnabledSystems] = useState<EnabledSystems>({});
  const [viewingDevVersionId, setViewingDevVersionId] = useState<string>('compose-new');


  const loadSelectionsFromDevVersion = useCallback((versionId: string) => {
    const version = publishedVersions.find(v => v.id === versionId);
    if (version) {
        const newSelections: VersionSelection = {};
        const newEnabled: EnabledSystems = {};
        // First, assume all systems are disabled
        systems.forEach(s => newEnabled[s.id] = false);

        // Then, enable and populate for systems present in the version
        for(const systemId in version.systems) {
            newEnabled[systemId] = true;
            newSelections[systemId] = version.systems[systemId];
        }
        setSelections(newSelections);
        setEnabledSystems(newEnabled);
    }
  }, [publishedVersions, systems]);


  useEffect(() => {
    // Initialize all systems as enabled when composing new
    const initialEnabledState = systems.reduce((acc, system) => {
        acc[system.id] = true;
        return acc;
    }, {} as EnabledSystems);
    setEnabledSystems(initialEnabledState);
  }, [systems]);
  
  useEffect(() => {
    if (viewingDevVersionId === 'compose-new') {
        setSelections({});
        // Re-enable all systems when switching back to compose new
        const allEnabled = systems.reduce((acc, system) => ({ ...acc, [system.id]: true }), {});
        setEnabledSystems(allEnabled);
    } else {
        loadSelectionsFromDevVersion(viewingDevVersionId);
    }
  }, [viewingDevVersionId, systems, loadSelectionsFromDevVersion]);

  const handlePublish = () => {
    onPublish(selections, nextVersionString, enabledSystems);
  };
  
  const [devVersionToPromote, setDevVersionToPromote] = useState<string>('');


  const Header = (
    <CardHeader className="flex-1 flex flex-col justify-between text-center p-6 h-36">
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground px-4">{description}</p>
    </CardHeader>
  );

  const Content = (
     <>
        <CardContent>
            {isLive ? (
                <div className="flex flex-col items-center space-y-2">
                    <Label htmlFor="dev-version-select">Development Version to Promote</Label>
                    <Select value={devVersionToPromote} onValueChange={setDevVersionToPromote}>
                        <SelectTrigger id="dev-version-select" className="w-full max-w-xs">
                            <SelectValue placeholder="Select a dev version..." />
                        </SelectTrigger>
                        <SelectContent>
                            {publishedVersions.map(v => (
                                <SelectItem key={v.id} value={v.id}>
                                    {v.version} - {new Date(v.timestamp).toLocaleDateString()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                    <Label htmlFor="dev-version-viewer" className="font-semibold">View/Compose Dev Version</Label>
                    <Select onValueChange={setViewingDevVersionId} value={viewingDevVersionId}>
                        <SelectTrigger id="dev-version-viewer" className="mt-2">
                            <SelectValue placeholder="Compose New Dev Version..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="compose-new">Compose New Dev Version...</SelectItem>
                            <Separator/>
                            {publishedVersions.map(v => (
                                <SelectItem key={v.id} value={v.id}>
                                Version {v.version}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            {!isLive && (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[200px]">AI Type</TableHead>
                    <TableHead className="w-[120px]">Enabled</TableHead>
                    <TableHead>Version</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {systems.map((system) => (
                    <TableRow key={system.id} className={ !(enabledSystems[system.id] ?? true) ? 'opacity-40' : ''}>
                        <TableCell className="font-medium">{system.name}</TableCell>
                        <TableCell>
                            <Switch
                                checked={enabledSystems[system.id] ?? true}
                                onCheckedChange={(checked) => setEnabledSystems(prev => ({ ...prev, [system.id]: checked }))}
                            />
                        </TableCell>
                        <TableCell>
                        <Select
                            onValueChange={(value) => setSelections(prev => ({...prev, [system.id]: value}))}
                            value={selections[system.id]}
                            disabled={!(enabledSystems[system.id] ?? true)}
                        >
                            <SelectTrigger><SelectValue placeholder="Select Version" /></SelectTrigger>
                            <SelectContent>
                                {system.liveVersions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            )}
        </CardContent>
        <CardFooter className="pt-6">
             <div className="flex w-full flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-8">
                <div className="space-y-2">
                    <Label>Release Type</Label>
                    <RadioGroup
                        value={saveType}
                        className="flex gap-4"
                        onValueChange={(v) => onSaveTypeChange(v as any)}
                    >
                        <div className="flex items-center space-x-2"><RadioGroupItem value="major" id={`${isLive ? 'live-' : ''}major`} /><Label htmlFor={`${isLive ? 'live-' : ''}major`}>Major</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="minor" id={`${isLive ? 'live-' : ''}minor`} /><Label htmlFor={`${isLive ? 'live-' : ''}minor`}>Minor</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="patch" id={`${isLive ? 'live-' : ''}patch`} /><Label htmlFor={`${isLive ? 'live-' : ''}patch`}>Patch</Label></div>
                    </RadioGroup>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-muted-foreground">New {isLive ? 'Live' : 'Dev'} Version:</Label>
                    <Badge variant={isLive ? 'secondary' : 'outline'}>{nextVersionString}</Badge>
                </div>
                </div>
                <Button
                onClick={isLive ? () => devVersionToPromote && onPromote?.(devVersionToPromote, saveType) : handlePublish}
                disabled={isLoading || (isLive && !devVersionToPromote)}
                >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLive ? 'Promote to Live' : 'Publish to Dev'}
                </Button>
            </div>
        </CardFooter>
    </>
  );

  if (isCollapsible) {
    return (
      <Card className="border-0 border-b shadow-none rounded-none">
        <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="hover:no-underline p-0">
              {Header}
            </AccordionTrigger>
            <AccordionContent>
              {Content}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    );
  }

  return (
    <Card className="border-b rounded-none shadow-none">
        {Header}
        {Content}
    </Card>
  )
}


export function AISystemVersionManager({ onUpdate }: { onUpdate: () => void }) {
  const [systems, setSystems] = useState<SystemWithVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [livePublishedVersions, setLivePublishedVersions] = useState<AppAIVersion[]>([]);
  const [devPublishedVersions, setDevPublishedVersions] = useState<AppAIVersion[]>([]);
  
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [developmentVersionId, setDevelopmentVersionId] = useState<string | null>(null);
  
  const [devSaveType, setDevSaveType] = useState<'major' | 'minor' | 'patch'>('patch');
  const [liveSaveType, setLiveSaveType] = useState<'major' | 'minor' | 'patch'>('patch');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedSystems, liveVersions, devVersions, config] = await Promise.all([
        getPromptSystems(),
        getAppAIVersions('live'),
        getAppAIVersions('dev'),
        getAppAIConfig()
      ]);
      
      setActiveVersionId(config?.activeAppAIVersion || null);
      setDevelopmentVersionId(config?.developmentAppAIVersion || null);
      setLivePublishedVersions(liveVersions);
      setDevPublishedVersions(devVersions);

      const systemsWithVersions: SystemWithVersion[] = await Promise.all(
        fetchedSystems.map(async (system) => {
          const allSystemVersions = await getPromptVersionsForSystem(system.id, 'all');
          return {
            ...system,
            liveVersions: allSystemVersions.filter(v => !v.isDevelopment).map(v => v.version),
            devVersions: allSystemVersions.filter(v => v.isDevelopment).map(v => v.version),
          };
        })
      );
      setSystems(systemsWithVersions);
    } catch (error) {
      console.error('Failed to fetch AI systems:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load AI systems from Firestore.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePublishToDev = async (selections: VersionSelection, version: string, enabledSystems: EnabledSystems) => {
    setIsSubmitting(true);
    try {
        const enabledSystemIds = Object.keys(enabledSystems).filter(id => enabledSystems[id]);
        if (enabledSystemIds.some(id => !selections[id])) {
            toast({
                variant: 'destructive',
                title: 'Incomplete Selection',
                description: 'Please select a version for all enabled systems.',
            });
            return;
        }

        const finalSelections: VersionSelection = {};
        for (const id of enabledSystemIds) {
            finalSelections[id] = selections[id];
        }

        await publishNewAppAIVersion(version, finalSelections, true);
        toast({ title: 'Published to Dev!', description: `Version ${version} is now available for testing.` });
        onUpdate();
        fetchData();
    } catch (error) {
        console.error('Failed to publish to dev:', error);
        toast({ variant: 'destructive', title: 'Publish Failed' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePromoteToLive = async (devVersionId: string, type: 'major' | 'minor' | 'patch') => {
      setIsSubmitting(true);
      try {
          const newLiveVersion = await promoteDevelopmentVersionToLive(devVersionId, type);
          toast({ title: 'Promoted to Live!', description: `Version ${newLiveVersion.version} is now live.` });
          onUpdate();
          fetchData();
      } catch (error) {
          console.error('Failed to promote to live:', error);
          toast({ variant: 'destructive', title: 'Promotion Failed', description: (error as Error).message });
      } finally {
          setIsSubmitting(false);
      }
  };


  const nextDevVersionString = useMemo(() => {
    const latestVersion = devPublishedVersions[0]; // Assumes sorted desc
    if (!latestVersion) return 'v1.0.0-dev';

    const versionString = latestVersion.version.replace('-dev', '').replace('v', '');
    const [major, minor, patch] = versionString.split('.').map(Number);
    
    let nextVersion: string;
    if (devSaveType === 'major') {
        nextVersion = `v${major + 1}.0.0-dev`;
    } else if (devSaveType === 'minor') {
        nextVersion = `v${major}.${minor + 1}.0-dev`;
    } else { // patch
        nextVersion = `v${major}.${minor}.${patch + 1}-dev`;
    }
    
    return nextVersion;
  }, [devPublishedVersions, devSaveType]);
  
  const nextLiveVersionString = useMemo(() => {
    const latestVersion = livePublishedVersions[0]; // Assumes sorted desc
    if (!latestVersion) return 'v1.0.0';

    const versionString = latestVersion.version.replace('v', '');
    const [major, minor, patch] = versionString.split('.').map(Number);
    
    if (liveSaveType === 'major') {
        return `v${major + 1}.0.0`;
    } else if (liveSaveType === 'minor') {
        return `v${major}.${minor + 1}.0`;
    } else { // patch
        return `v${major}.${minor}.${patch + 1}`;
    }
  }, [livePublishedVersions, liveSaveType]);


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <Card className="pt-6">
            <VersionPublisher
                title="Live Version"
                description={`The AI system bundle currently live is ${activeVersionId || 'None'}. Select a Development Version below to promote it.`}
                systems={systems}
                publishedVersions={devPublishedVersions}
                activeVersionId={activeVersionId}
                saveType={liveSaveType}
                onSaveTypeChange={setLiveSaveType}
                nextVersionString={nextLiveVersionString}
                onPublish={() => {}}
                isLoading={isSubmitting}
                isLive={true}
                onPromote={handlePromoteToLive}
            />
        </Card>
      
        <Card className="pt-6">
            <VersionPublisher
                title="Development Versions"
                description="Compose a new development version by selecting a version for each AI Type below. This version will only be used in developer mode."
                systems={systems}
                publishedVersions={devPublishedVersions}
                activeVersionId={developmentVersionId}
                saveType={devSaveType}
                onSaveTypeChange={setDevSaveType}
                nextVersionString={nextDevVersionString}
                onPublish={handlePublishToDev}
                isLoading={isSubmitting}
                isCollapsible={true}
            />
        </Card>
    </div>
  );
}
