
'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import type { BirdLog } from '@/lib/types';
import { getLogById } from '@/lib/local-storage';

import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function LogDetailPage({ params }: { params: { id: string } }) {
  const [log, setLog] = useState<BirdLog | null | undefined>(undefined);

  useEffect(() => {
    const fetchedLog = getLogById(params.id);
    setLog(fetchedLog);
  }, [params.id]);

  if (log === undefined) {
    return (
      <AppLayout header={<SecondaryHeader title="Loading..." />}>
        <main className="flex-1 p-4">
          <Skeleton className="w-full h-64" />
          <Skeleton className="w-1/2 h-8 mt-4" />
          <Skeleton className="w-1/3 h-6 mt-2" />
          <Skeleton className="w-full h-24 mt-4" />
        </main>
        <SecondaryPageFooterV2 />
      </AppLayout>
    );
  }

  if (log === null) {
    notFound();
  }

  return (
    <AppLayout header={<SecondaryHeader title={log.commonName} />}>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <div className="aspect-video relative w-full rounded-md overflow-hidden bg-muted">
               <Image
                  src={log.isMystery ? `https://picsum.photos/seed/mystery/600/400` : `https://picsum.photos/seed/${log.id}/600/400`}
                  alt={log.commonName}
                  fill
                  className="object-cover"
                  data-ai-hint={log.imagePrompt}
                />
            </div>
             <CardTitle className="pt-4 text-3xl">{log.commonName}</CardTitle>
             <p className="text-lg text-muted-foreground italic">{log.scientificName}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base">{log.description}</p>
            {log.isMystery && log.audioUrl && (
              <div>
                <h3 className="font-semibold mb-2">Saved Recording</h3>
                <audio controls src={log.audioUrl} className="w-full">
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            <div className="flex gap-2">
                <Badge variant="secondary">Captured: {new Date(log.timestamp).toLocaleDateString()}</Badge>
                 {log.isMystery && <Badge variant="destructive">Unidentified</Badge>}
            </div>
          </CardContent>
        </Card>
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
