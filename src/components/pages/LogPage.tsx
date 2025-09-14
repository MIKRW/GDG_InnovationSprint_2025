
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { groupBy } from 'lodash';

import type { BirdLog, SortOption } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PageTitle } from '../content/PageTitle';
import { FlaskConical, HelpCircle, ShieldAlert, Loader2, Mic } from 'lucide-react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

interface LogPageProps {
    searchQuery: string;
    sortOption: SortOption;
}

export function LogPage({ searchQuery, sortOption }: LogPageProps) {
  const [allLogs, setAllLogs] = useState<BirdLog[]>([]);
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return; // Wait for auth to finish
    }
    if (!user) {
      // If auth is done and there's no user, stop loading and show empty state.
      console.warn("Log page cannot fetch data: No user authenticated.");
      setLoading(false);
      setAllLogs([]);
      return;
    }

    // User is authenticated, fetch their data
    setLoading(true);
    const logsCollectionRef = collection(db, 'users', user.uid, 'identifications');
    const q = query(logsCollectionRef, where('isDisowned', '==', false), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const logs: BirdLog[] = [];
        querySnapshot.forEach((doc) => {
            logs.push({ id: doc.id, ...doc.data() } as BirdLog);
        });
        setAllLogs(logs);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching logs:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const groupedAndSortedLogs = useMemo(() => {
    const identifiedLogs = allLogs.filter(log => !log.isMystery);
    const hasMysteryLogs = allLogs.some(log => log.isMystery);

    const filtered = identifiedLogs.filter(log =>
        log.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.scientificName && log.scientificName.toLowerCase().includes(searchQuery.toLowerCase()))
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


  return (
    <>
       {isDevMode && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                Developer Tools
            </h2>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Link href="/log/test">
                  <Card className="overflow-hidden h-full flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-xl bg-hazard-stripes p-1 rounded-lg cursor-pointer">
                      <div className="bg-background h-full flex flex-col rounded-sm">
                          <CardContent className="p-0 flex-grow flex items-center justify-center">
                              <div className="aspect-square relative w-full flex items-center justify-center">
                                  <FlaskConical className="w-24 h-24 text-secondary-foreground" />
                              </div>
                          </CardContent>
                          <CardFooter className="p-4 bg-background/80 backdrop-blur-sm">
                              <div className="text-left">
                              <p className="font-bold text-sm truncate">Master Audio Tests</p>
                              <p className="text-xs text-muted-foreground truncate italic">Controlled test runs</p>
                              </div>
                          </CardFooter>
                      </div>
                  </Card>
                </Link>
                <Link href="/log/test/live">
                  <Card className="overflow-hidden h-full flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-xl bg-hazard-stripes p-1 rounded-lg cursor-pointer">
                      <div className="bg-background h-full flex flex-col rounded-sm">
                          <CardContent className="p-0 flex-grow flex items-center justify-center">
                              <div className="aspect-square relative w-full flex items-center justify-center">
                                  <Mic className="w-24 h-24 text-secondary-foreground" />
                              </div>
                          </CardContent>
                          <CardFooter className="p-4 bg-background/80 backdrop-blur-sm">
                              <div className="text-left">
                              <p className="font-bold text-sm truncate">Live Test Logs</p>
                              <p className="text-xs text-muted-foreground truncate italic">Live dev recordings</p>
                              </div>
                          </CardFooter>
                      </div>
                  </Card>
                </Link>
                <Link href="/log/errors">
                  <Card className="overflow-hidden h-full flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-xl bg-hazard-stripes p-1 rounded-lg cursor-pointer">
                      <div className="bg-background h-full flex flex-col rounded-sm">
                          <CardContent className="p-0 flex-grow flex items-center justify-center">
                              <div className="aspect-square relative w-full flex items-center justify-center">
                                  <ShieldAlert className="w-24 h-24 text-secondary-foreground" />
                              </div>
                          </CardContent>
                          <CardFooter className="p-4 bg-background/80 backdrop-blur-sm">
                              <div className="text-left">
                              <p className="font-bold text-sm truncate">Error Logs</p>
                              <p className="text-xs text-muted-foreground truncate italic">Application error instances</p>
                              </div>
                          </CardFooter>
                      </div>
                  </Card>
                </Link>
            </div>
          </div>
        )}

      {loading ? (
           <div className="text-center py-16 flex flex-col items-center">
               <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mb-4" />
               <PageTitle>Loading Bird Book...</PageTitle>
               <p className="mt-4 text-muted-foreground">Just a moment...</p>
           </div>
      ): (
        <>
            {groupedAndSortedLogs.hasMystery && (
                <div className="mb-8">
                  <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                      Review
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <Link href="/log/mystery">
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
                  </div>
                </div>
            )}
            
            {Object.entries(groupedAndSortedLogs.groupedSessions).length > 0 && Object.entries(groupedAndSortedLogs.groupedSessions).map(([sessionId, logs]) => (
                <div key={sessionId} className="mb-8">
                    <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                        Recording Session - {new Date(logs[0].timestamp).toLocaleString()}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {logs.map((log) => (
                        <Link href={`/log/${log.id}`} key={log.id}>
                        <Card className="overflow-hidden h-full flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
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
            ))}

            {Object.keys(groupedAndSortedLogs.groupedSessions).length === 0 && searchQuery && !loading && (
                <div className="col-span-full text-center py-16">
                    <p className="text-lg text-muted-foreground">No results found for "{searchQuery}".</p>
                </div>
            )}

            {allLogs.length === 0 && !loading && (
                 <div className="text-center py-16">
                    <PageTitle>Your Bird Book is Empty</PageTitle>
                    <p className="mt-4 text-muted-foreground">You haven't identified any birds yet.</p>
                    <Button className="mt-4" onClick={() => router.push('/record')}>
                        Start your collection!
                    </Button>
                </div>
            )}
        </>
      )}
    </>
  );
}
