
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageTitle } from '@/components/content/PageTitle';
import { AppAIVersionManager } from '@/components/content/AppAIVersionManager';
import { PromptSystemVersionManager } from '@/components/content/PromptSystemVersionManager';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getPromptSystems, getPromptVersionsForSystem, getPromptContentForSystem, createNewPromptSystem } from '@/lib/actions';
import type { PromptSystem, PromptVersion, PromptContent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PromptContentManager } from '@/components/content/PromptContentManager';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { kebabCase } from 'lodash';

export default function PromptManagementPage() {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  const { toast } = useToast();

  const [allSystems, setAllSystems] = useState<PromptSystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [versionsForSelectedSystem, setVersionsForSelectedSystem] = useState<PromptVersion[]>([]);
  const [contentForSelectedSystem, setContentForSelectedSystem] = useState<PromptContent[]>([]);

  // State for the "Create New System" dialog
  const [isSystemDialogOpen, setIsSystemDialogOpen] = useState(false);
  const [newSystemName, setNewSystemName] = useState('');
  const [newSystemDescription, setNewSystemDescription] = useState('');
  const [isCreatingSystem, setIsCreatingSystem] = useState(false);


  const fetchAllData = useCallback(async (systemIdToFetch: string | null) => {
    setLoading(true);
    try {
      const systems = await getPromptSystems();
      setAllSystems(systems);

      let currentSystemId = systemIdToFetch;
      if (!currentSystemId && systems.length > 0) {
        currentSystemId = systems[0].id;
        setSelectedSystemId(systems[0].id);
      }

      if (currentSystemId) {
        const [versions, content] = await Promise.all([
          getPromptVersionsForSystem(currentSystemId),
          getPromptContentForSystem(currentSystemId)
        ]);
        setVersionsForSelectedSystem(versions);
        setContentForSelectedSystem(content);
      } else {
        setVersionsForSelectedSystem([]);
        setContentForSelectedSystem([]);
      }
    } catch (error) {
      console.error('Failed to fetch prompt system data', error);
      toast({
        variant: 'destructive',
        title: 'Error Loading Data',
        description: 'Could not load AI system data from the database.'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isDevMode) {
      fetchAllData(selectedSystemId);
    }
  }, [isDevMode, selectedSystemId, fetchAllData]);

  const handleSystemChange = (systemId: string) => {
    setSelectedSystemId(systemId);
  };
  
  const handleDataUpdate = () => {
    fetchAllData(selectedSystemId);
  }

  const handleCreateNewSystem = async () => {
    if (!newSystemName.trim() || !newSystemDescription.trim()) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a name and description.' });
        return;
    }
    setIsCreatingSystem(true);

    try {
        const newSystemId = kebabCase(newSystemName);
        await createNewPromptSystem({
            systemId: newSystemId,
            name: newSystemName,
            description: newSystemDescription,
        });

        toast({ title: 'System Created!', description: `${newSystemName} has been added.` });
        
        // Reset dialog and refetch data, selecting the new system
        setIsSystemDialogOpen(false);
        setNewSystemName('');
        setNewSystemDescription('');
        await fetchAllData(newSystemId); // Refetch all data
        setSelectedSystemId(newSystemId); // Explicitly select the new system

    } catch (error) {
        console.error('Failed to create new system:', error);
        toast({ variant: 'destructive', title: 'Creation Failed', description: (error as Error).message || 'Could not create the new AI system.' });
    } finally {
        setIsCreatingSystem(false);
    }
  };


  if (!isDevMode) {
    return (
      <div className="flex-1 p-4 text-center">
        <p>This page is not available.</p>
      </div>
    );
  }
  
  const selectedSystem = allSystems.find(s => s.id === selectedSystemId) || null;

  return (
    <div className="container mx-auto">
      <div className="text-center mb-8">
        <PageTitle>AI Systems</PageTitle>
        <p className="text-muted-foreground mx-auto max-w-3xl">
          This is the central hub for managing the AI "brains" of the application. Use the top-level publisher to set a combination of AI systems live. Use the system-level publisher to create new versions of a specific AI system from its underlying prompt components.
        </p>
      </div>

      <AppAIVersionManager />

      <Separator className="my-12" />

      <Card className="mb-8">
        <CardHeader>
            <CardTitle className="text-6xl text-center">AI System Editor</CardTitle>
            <CardDescription className="text-center">Choose the AI system you want to manage. The publisher and editor below will update accordingly.</CardDescription>
            <div className="flex justify-center pt-4">
                {loading && !selectedSystemId ? (
                    <Skeleton className="h-10 w-full max-w-xs" />
                ) : (
                    <div className="flex items-center gap-4">
                        <Label htmlFor="system-selector" className="font-semibold whitespace-nowrap">AI Type</Label>
                        <Select value={selectedSystemId || ''} onValueChange={handleSystemChange}>
                            <SelectTrigger id="system-selector" className="w-full sm:w-[250px]">
                            <SelectValue placeholder="Select a system" />
                            </SelectTrigger>
                            <SelectContent>
                            {allSystems.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <Dialog open={isSystemDialogOpen} onOpenChange={setIsSystemDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">Create New...</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New AI System</DialogTitle>
                                    <DialogDescription>
                                        Define a new high-level AI system. The ID will be automatically generated from the name (e.g., "Theme Generator" becomes "theme-generator").
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-system-name">System Name</Label>
                                        <Input id="new-system-name" placeholder="e.g., Theme Generator" value={newSystemName} onChange={(e) => setNewSystemName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-system-desc">Description</Label>
                                        <Textarea id="new-system-desc" placeholder="What does this AI system do?" value={newSystemDescription} onChange={(e) => setNewSystemDescription(e.target.value)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsSystemDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateNewSystem} disabled={isCreatingSystem}>
                                        {isCreatingSystem && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create System
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <PromptSystemVersionManager 
                system={selectedSystem}
                versions={versionsForSelectedSystem}
                content={contentForSelectedSystem}
                onUpdate={handleDataUpdate}
                isLoading={loading}
            />

            <Separator className="my-12" />

            <PromptContentManager 
                systemId={selectedSystemId} 
                content={contentForSelectedSystem}
                onUpdate={handleDataUpdate}
                isLoading={loading}
            />
        </CardContent>
      </Card>
    </div>
  );
}

    
