

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, query, onSnapshot, orderBy, where, or, and, Query } from 'firebase/firestore';
import { groupBy } from 'lodash';

import type { BirdLog } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PageTitle } from '../content/PageTitle';
import { Bird, FlaskConical, HelpCircle, ShieldAlert, Loader2, Mic } from 'lucide-react';
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
      console.warn("Log page cannot fetch data: No user authenticated.");
      setLoading(false);
      setAllLogs([]);
      return;
    }

    setLoading(true);
    const logsCollectionRef = collection(db, 'users', user.uid, 'identifications');
    
    // Base query
    let q: Query = query(logsCollectionRef);

    // Apply base filters
    q = query(q, where('status', '==', 'active'), where('isMystery', '==', false));

    // Apply search filter if there is a query.
    // NOTE: This basic search requires Firestore to have single-field indexes on all fields being searched.
    // For more complex text search, a dedicated search service like Algolia or Elasticsearch would be better.
    if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        q = query(q, or(
            where('commonName', '>=', lowerCaseQuery),
            where('commonName', '<=', lowerCaseQuery + '\uf8ff'),
            where('scientificName', '>=', lowerCaseQuery),
            where('scientificName', '<=', lowerCaseQuery + '\uf8ff')
        ));
    }

    // Apply sorting. This can create multiple composite index requirements.
    // Firestore will provide an error with a link to create them.
    switch (sortOption) {
        case 'a-z':
            q = query(q, orderBy('commonName', 'asc'));
            break;
        case 'z-a':
            q = query(q, orderBy('commonName', 'desc'));
            break;
        case 'oldest':
            q = query(q, orderBy('timestamp', 'asc'));
            break;
        case 'newest':
        default:
            q = query(q, orderBy('timestamp', 'desc'));
            break;
    }


    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const logs: BirdLog[] = [];
        querySnapshot.forEach((doc) => {
            // Client-side filtering for more accurate case-insensitive search
            const data = doc.data() as BirdLog;
            if (searchQuery) {
                const commonNameMatch = data.commonName.toLowerCase().includes(searchQuery.toLowerCase());
                const scientificNameMatch = data.scientificName?.toLowerCase().includes(searchQuery.toLowerCase());
                if (commonNameMatch || scientificNameMatch) {
                    logs.push({ id: doc.id, ...data });
                }
            } else {
                 logs.push({ id: doc.id, ...data });
            }
        });
        setAllLogs(logs);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching logs:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, sortOption, searchQuery]);

  const groupedSessions = useMemo(() => {
    return groupBy(allLogs, 'sessionId');
  }, [allLogs]);


  // Separate effect to check for any mystery logs to show the "Mystery Recordings" button
  const [hasMysteryLogs, setHasMysteryLogs] = useState(false);
  useEffect(() => {
    if(!user) return;
    const mysteryQuery = query(collection(db, 'users', user.uid, 'identifications'), where('isMystery', '==', true), where('status', '==', 'active'));
    const unsub = onSnapshot(mysteryQuery, (snapshot) => {
        setHasMysteryLogs(!snapshot.empty);
    });
    return () => unsub();
  }, [user]);


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
            {hasMysteryLogs && (
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
            
            {Object.entries(groupedSessions).length > 0 && Object.entries(groupedSessions).map(([sessionId, logs]) => (
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
                                    {log.imageUrl ? (
                                        <Image
                                            src={log.imageUrl}
                                            alt={log.commonName}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                                            <Bird className="w-16 h-16 text-muted-foreground" />
                                        </div>
                                    )}
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

            {allLogs.length === 0 && searchQuery && !loading && (
                <div className="col-span-full text-center py-16">
                    <p className="text-lg text-muted-foreground">No results found for "{searchQuery}".</p>
                </div>
            )}

            {allLogs.length === 0 && !hasMysteryLogs && !loading && (
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
