'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageTitle } from '@/components/content/PageTitle';
import { AppAIVersionManager } from '@/components/content/AppAIVersionManager';
import { PromptSystemVersionManager } from '@/components/content/PromptSystemVersionManager';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getPromptSystems } from '@/lib/actions';
import type { PromptSystem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PromptContentManager } from '@/components/content/PromptContentManager';

export default function PromptManagementPage() {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  const [promptSystems, setPromptSystems] = useState<PromptSystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [loadingSystems, setLoadingSystems] = useState(true);

  const fetchSystems = useCallback(async () => {
    setLoadingSystems(true);
    try {
      const systems = await getPromptSystems();
      setPromptSystems(systems);
      if (systems.length > 0 && !selectedSystemId) {
        setSelectedSystemId(systems[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch prompt systems', error);
    } finally {
      setLoadingSystems(false);
    }
  }, [selectedSystemId]);

  useEffect(() => {
    if (isDevMode) {
      fetchSystems();
    }
  }, [isDevMode, fetchSystems]);

  if (!isDevMode) {
    return (
      <div className="flex-1 p-4 text-center">
        <p>This page is not available.</p>
      </div>
    );
  }

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
          <CardTitle>Select AI System</CardTitle>
          <CardDescription>Choose the AI system you want to manage. The publisher below will update accordingly.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSystems ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex items-center gap-4">
              <Label htmlFor="system-selector" className="font-semibold whitespace-nowrap">AI System</Label>
              <Select value={selectedSystemId || ''} onValueChange={setSelectedSystemId}>
                <SelectTrigger id="system-selector" className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Select a system" />
                </SelectTrigger>
                <SelectContent>
                  {promptSystems.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <PromptSystemVersionManager systemId={selectedSystemId} onUpdate={fetchSystems} />

      <Separator className="my-12" />

      <PromptContentManager systemId={selectedSystemId} />

    </div>
  );
}
