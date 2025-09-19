
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageTitle } from '@/components/content/PageTitle';
import { AISystemVersionManager } from '@/components/content/AISystemVersionManager';
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
import { ChevronDown, Loader2 } from 'lucide-react';
import { kebabCase } from 'lodash';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { notFound } from 'next/navigation';
import { useIsDevMode } from '@/hooks/useIsDevMode';

export default function PromptManagementPage() {
  const isDevMode = useIsDevMode();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

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
    setIsClient(true);
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


  if (isClient && !isDevMode) {
    notFound();
  }

  if (!isClient) {
      return null;
  }
  
  const selectedSystem = allSystems.find(s => s.id === selectedSystemId) || null;

  return (
    <div className="container mx-auto">
      <Card className="mb-8 bg-card-header text-center">
        <CardHeader>
            <PageTitle>AI Systems</PageTitle>
            <CardDescription className="text-muted-foreground mx-auto max-w-3xl">
            This is the central hub for managing the AI "brains" of the application. Use the top-level publisher to set a combination of AI systems live. Use the system-level publisher to create new versions of a specific AI system from its underlying prompt components.
            </CardDescription>
        </CardHeader>
      </Card>

      <AISystemVersionManager onUpdate={handleDataUpdate} />
      
      <Card className="my-8">
        <CardHeader className="text-center border-b pb-6">
          <CardTitle className="text-2xl font-bold mt-4">AI Type</CardTitle>
          <div className="flex justify-center items-center gap-4 pt-4">
            {loading && !selectedSystemId ? (
              <Skeleton className="h-14 w-full max-w-xs" />
            ) : (
              <>
                <Select value={selectedSystemId || ''} onValueChange={handleSystemChange}>
                  <SelectTrigger id="system-selector" className="w-full sm:w-[250px] h-14 text-lg">
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
                    <Button variant="outline" className="h-14 text-lg">Create New...</Button>
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
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
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
