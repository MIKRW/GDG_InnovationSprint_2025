
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import type { BirdLog } from '@/lib/types';
import { getLogs } from '@/lib/local-storage';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PageTitle } from '../content/PageTitle';

export function LogPage() {
  const [logs, setLogs] = useState<BirdLog[]>([]);

  useEffect(() => {
    setLogs(getLogs());
  }, []);

  if (logs.length === 0) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
             <PageTitle>Your Bird Book</PageTitle>
             <p className="mt-4 text-muted-foreground">You haven't identified any birds yet.</p>
             <p className="mt-2 text-muted-foreground">Go to the record page to start your collection!</p>
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle>Your Bird Book</PageTitle>
      <p className="text-muted-foreground mb-6">Here are the birds you've successfully identified.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {logs.map((log) => (
          <Link href={`/log/${log.id}`} key={log.id}>
            <Card className="overflow-hidden h-full flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <CardContent className="p-0 flex-grow">
                <div className="aspect-square relative w-full">
                  <Image
                    src={`https://picsum.photos/seed/${log.id}/400/400`}
                    alt={log.commonName}
                    fill
                    className="object-cover"
                    data-ai-hint={log.imagePrompt}
                  />
                </div>
              </CardContent>
              <CardFooter className="p-4 bg-background/80 backdrop-blur-sm">
                <div className="text-left">
                  <p className="font-bold text-sm truncate">{log.commonName}</p>
                  <p className="text-xs text-muted-foreground truncate italic">{log.scientificName}</p>
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
