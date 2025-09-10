
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import type { BirdLog } from '@/lib/types';
import { getLogs } from '@/lib/local-storage';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PageTitle } from '../content/PageTitle';
import { HelpCircle } from 'lucide-react';

export function MysteryLogPage() {
  const [mysteryLogs, setMysteryLogs] = useState<BirdLog[]>([]);

  useEffect(() => {
    const allLogs = getLogs();
    setMysteryLogs(allLogs.filter(log => log.isMystery));
  }, []);

  if (mysteryLogs.length === 0) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
             <PageTitle>Mystery Recordings</PageTitle>
             <p className="mt-4 text-muted-foreground">You don't have any mystery recordings yet.</p>
             <p className="mt-2 text-muted-foreground">Recordings that the AI can't identify can be saved here.</p>
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle>Mystery Recordings</PageTitle>
      <p className="text-muted-foreground mb-6">These are recordings that the AI could not identify. You can listen to them here.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mysteryLogs.map((log) => (
          <Link href={`/log/${log.id}`} key={log.id}>
            <Card className="overflow-hidden h-full flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
              <CardContent className="p-0 flex-grow flex items-center justify-center bg-muted">
                <div className="aspect-square relative w-full flex items-center justify-center">
                   <Image
                    src={`https://picsum.photos/seed/mystery/400/400`}
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
                  <p className="text-xs text-muted-foreground truncate italic">Captured: {new Date(log.timestamp).toLocaleDateString()}</p>
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
