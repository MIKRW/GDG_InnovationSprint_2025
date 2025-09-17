
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
import type { PromptSystem, AppAIVersion } from '@/lib/types';
import { getPromptSystems, getPromptVersionsForSystem, getAppAIVersions, getAppAIConfig, publishNewAppAIVersion, promoteDevelopmentVersionToLive } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';

interface VersionSelection {
  [systemId: string]: string; // e.g., { 'bird-identifier-ai-newbie': 'v1.1.0' }
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
  onPublish: (selections: VersionSelection, version: string) => void;
  isLoading: boolean;
  isLive?: boolean;
  onPromote?: (versionId: string) => void;
}) {
  const [selections, setSelections] = useState<VersionSelection>({});

  const handlePublish = () => {
    if (systems.some(s => !selections[s.id])) {
      alert('Please select a version for all systems.');
      return;
    }
    onPublish(selections, nextVersionString);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">AI System</TableHead>
              <TableHead>Version</TableHead>
              {isLive && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {systems.map((system) => (
              <TableRow key={system.id}>
                <TableCell className="font-medium">{system.name}</TableCell>
                <TableCell>
                  <Select
                    onValueChange={(value) => setSelections(prev => ({...prev, [system.id]: value}))}
                    value={selections[system.id]}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Version" /></SelectTrigger>
                    <SelectContent>
                        {isLive ? (
                             publishedVersions.map(v => (
                                <SelectItem key={v.id} value={v.id}>
                                    {v.version} - {new Date(v.timestamp).toLocaleDateString()}
                                </SelectItem>
                            ))
                        ) : (
                            <>
                                {system.liveVersions.map(v => <SelectItem key={v} value={v}>Live: {v}</SelectItem>)}
                                {system.devVersions.length > 0 && <Separator />}
                                {system.devVersions.map(v => <SelectItem key={v} value={v}>Dev: {v}</SelectItem>)}
                            </>
                        )}
                    </SelectContent>
                  </Select>
                </TableCell>
                 {isLive && onPromote && (
                    <TableCell className="text-right">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => selections[system.id] && onPromote(selections[system.id])}
                            disabled={isLoading || !selections[system.id]}
                        >
                            Promote to Live
                        </Button>
                    </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {!isLive && (
        <CardFooter className="border-t pt-6 flex-wrap justify-between gap-4">
            <div className="flex items-center gap-8">
                <div className="space-y-2">
                <Label>New Version Type</Label>
                <RadioGroup
                    value={saveType}
                    className="flex gap-4"
                    onValueChange={(v) => onSaveTypeChange(v as any)}
                >
                    <div className="flex items-center space-x-2"><RadioGroupItem value="major" id="major" /><Label htmlFor="major">Major</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="minor" id="minor" /><Label htmlFor="minor">Minor</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="patch" id="patch" /><Label htmlFor="patch">Patch</Label></div>
                </RadioGroup>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-muted-foreground">Next Dev Version:</Label>
                    <Badge variant="outline">{nextVersionString}</Badge>
                </div>
            </div>
            <Button onClick={handlePublish} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish to Dev
            </Button>
        </CardFooter>
      )}
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
  
  const [saveType, setSaveType] = useState<'major' | 'minor' | 'patch'>('patch');
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

  const handlePublishToDev = async (selections: VersionSelection, version: string) => {
    setIsSubmitting(true);
    try {
        await publishNewAppAIVersion(version, selections, true);
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

  const handlePromoteToLive = async (devVersionId: string) => {
      setIsSubmitting(true);
      try {
          const newLiveVersion = await promoteDevelopmentVersionToLive(devVersionId);
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
    if (!latestVersion) return "v1-dev";

    const baseVersion = Number(latestVersion.version.replace('v','').split('-')[0]);
    return `v${baseVersion + 1}-dev`;
  }, [devPublishedVersions]);


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
      <p className="text-sm text-muted-foreground">
        The top card shows the version currently being served to live users. The bottom card is for composing and testing new development versions. Once a development version is ready, you can 'Promote' it from the top card to make it live.
      </p>

      <VersionPublisher
        title="Live Version"
        description={`The AI system bundle currently live is ${activeVersionId || 'None'}. Select a Development Version below to promote it.`}
        systems={systems}
        publishedVersions={devPublishedVersions}
        activeVersionId={activeVersionId}
        saveType={saveType}
        onSaveTypeChange={setSaveType}
        nextVersionString=""
        onPublish={() => {}}
        isLoading={isSubmitting}
        isLive={true}
        onPromote={handlePromoteToLive}
      />
      
      <VersionPublisher
        title="Development Versions"
        description="Compose a new development version by selecting a version for each AI Type below. This version will only be used in developer mode."
        systems={systems}
        publishedVersions={[]}
        activeVersionId={developmentVersionId}
        saveType={saveType}
        onSaveTypeChange={setSaveType}
        nextVersionString={nextDevVersionString}
        onPublish={handlePublishToDev}
        isLoading={isSubmitting}
      />
    </div>
  );
}
