
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { groupBy } from 'lodash';

import type { BirdLog, SortOption } from '@/lib/types';
import { db } from '@/lib/firebase';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PageTitle } from '../content/PageTitle';
import { FlaskConical, HelpCircle } from 'lucide-react';

interface LogPageProps {
    searchQuery: string;
    sortOption: SortOption;
}

export function LogPage({ searchQuery, sortOption }: LogPageProps) {
  const [allLogs, setAllLogs] = useState<BirdLog[]>([]);
  const [loading, setLoading] = useState(true);
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  // This component will not work correctly without authentication.
  // For now, it will show a loading state indefinitely.
  // We will restore its functionality when we re-implement auth.
  useEffect(() => {
    setLoading(true);
    console.warn("Log page cannot fetch data: Authentication is disabled.");
  }, []);

  const groupedAndSortedLogs = useMemo(() => {
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
    
    // Group by sessionId
    const groupedBySession = groupBy(sorted, 'sessionId');

    return { groupedSessions: groupedBySession, hasMystery: hasMysteryLogs };

  }, [allLogs, searchQuery, sortOption]);


  if (loading) {
      return (
          <div className="container mx-auto px-4 py-8 text-center">
               <PageTitle>Loading Your Bird Book...</PageTitle>
               <p className="mt-4 text-muted-foreground">Logbook functionality is temporarily disabled.</p>
          </div>
      )
  }

  if (allLogs.length === 0 && !isDevMode) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
             <PageTitle>Your Bird Book is Empty</PageTitle>
             <p className="mt-4 text-muted-foreground">You haven't identified any birds yet.</p>
             <p className="mt-2 text-muted-foreground">Go to the record page to start your collection!</p>
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isDevMode && (
           <Link href="/log/test" legacyBehavior>
            <Card className="overflow-hidden h-full flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-xl bg-hazard-stripes p-1 rounded-lg cursor-pointer">
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
        {groupedAndSortedLogs.hasMystery && (
           <Link href="/log/mystery" legacyBehavior>
            <Card className="overflow-hidden h-full flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-xl bg-secondary cursor-pointer">
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
      </div>

       {Object.entries(groupedAndSortedLogs.groupedSessions).map(([sessionId, logs]) => (
           <div key={sessionId}>
               <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                   Recording Session - {new Date(logs[0].timestamp).toLocaleString()}
               </h2>
               <Card className="p-4">
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {logs.map((log) => (
                      <Link href={`/log/${log.id}`} key={log.id} legacyBehavior>
                        <Card className="overflow-hidden h-full flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
                          <CardContent className="p-0 flex-grow">
                            <div className="aspect-square relative w-full">
                              <Image
                                src={log.audioUrl ? `https://picsum.photos/seed/${log.id}/400/400` : '/placeholder.png'}
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
               </Card>
           </div>
       ))}

       {Object.keys(groupedAndSortedLogs.groupedSessions).length === 0 && searchQuery && (
           <div className="col-span-full text-center py-16">
                <p className="text-lg text-muted-foreground">No results found for "{searchQuery}".</p>
           </div>
       )}
    </div>
  );
}
