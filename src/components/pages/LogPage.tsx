
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import type { BirdLog, SortOption } from '@/lib/types';
import { getLogs } from '@/lib/local-storage';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PageTitle } from '../content/PageTitle';
import { FlaskConical, HelpCircle } from 'lucide-react';

interface LogPageProps {
    searchQuery: string;
    sortOption: SortOption;
}

export function LogPage({ searchQuery, sortOption }: LogPageProps) {
  const [allLogs, setAllLogs] = useState<BirdLog[]>([]);
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    setAllLogs(getLogs());
  }, []);

  const filteredAndSortedLogs = useMemo(() => {
    const identifiedLogs = allLogs.filter(log => !log.isMystery);
    const hasMysteryLogs = allLogs.some(log => log.isMystery);

    const filtered = identifiedLogs.filter(log =>
        log.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.scientificName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
        switch (sortOption) {
            case 'newest':
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            case 'oldest':
                return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            case 'a-z':
                return a.commonName.localeCompare(b.commonName);
            case 'z-a':
                return b.commonName.localeCompare(a.commonName);
            default:
                return 0;
        }
    });

    return { logs: sorted, hasMystery: hasMysteryLogs };

  }, [allLogs, searchQuery, sortOption]);


  if (allLogs.length === 0 && !isDevMode) {
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isDevMode && (
           <Link href="/log/test">
            <Card className="overflow-hidden h-full flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-xl bg-hazard-stripes p-1 rounded-lg">
                <div className="bg-background h-full flex flex-col rounded-sm">
                    <CardContent className="p-0 flex-grow flex items-center justify-center">
                        <div className="aspect-square relative w-full flex items-center justify-center">
                            <FlaskConical className="w-24 h-24 text-secondary-foreground" />
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 bg-background/80 backdrop-blur-sm">
                        <div className="text-left">
                        <p className="font-bold text-sm truncate">Test Results</p>
                        <p className="text-xs text-muted-foreground truncate italic">Developer test logs</p>
                        </div>
                    </CardFooter>
                </div>
            </Card>
          </Link>
        )}
        {filteredAndSortedLogs.hasMystery && (
           <Link href="/log/mystery">
            <Card className="overflow-hidden h-full flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-xl bg-secondary">
              <CardContent className="p-0 flex-grow flex items-center justify-center">
                <div className="aspect-square relative w-full flex items-center justify-center">
                    <HelpCircle className="w-24 h-24 text-secondary-foreground" />
                </div>
              </CardContent>
              <CardFooter className="p-4 bg-background/80 backdrop-blur-sm">
                <div className="text-left">
                  <p className="font-bold text-sm truncate">Mystery Recordings</p>
                  <p className="text-xs text-muted-foreground truncate italic">Unidentified bird songs</p>
                </div>
              </CardFooter>
            </Card>
          </Link>
        )}
        {filteredAndSortedLogs.logs.map((log) => (
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
       {filteredAndSortedLogs.logs.length === 0 && searchQuery && (
           <div className="col-span-full text-center py-16">
                <p className="text-lg text-muted-foreground">No results found for "{searchQuery}".</p>
           </div>
       )}
    </div>
  );
}
