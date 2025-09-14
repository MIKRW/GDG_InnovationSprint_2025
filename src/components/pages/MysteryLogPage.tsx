
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, query, onSnapshot, orderBy, where, Query } from 'firebase/firestore';

import type { BirdLog, SortOption } from '@/lib/types';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PageTitle } from '../content/PageTitle';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';

interface MysteryLogPageProps {
    searchQuery: string;
    sortOption: SortOption;
}

export function MysteryLogPage({ searchQuery, sortOption }: MysteryLogPageProps) {
  const [allLogs, setAllLogs] = useState<BirdLog[]>([]);
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();


  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return; // Wait for auth to finish
    }
    if (!user) {
      console.warn("Mystery log page cannot fetch data: No user authenticated.");
      setLoading(false);
      setAllLogs([]);
      return;
    }

    setLoading(true);
    const logsCollectionRef = collection(db, 'users', user.uid, 'identifications');
    
    // This query is now simpler and avoids the composite index requirement.
    const q: Query = query(logsCollectionRef, where('isMystery', '==', true), where('isDisowned', '==', false));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const logs: BirdLog[] = [];
        querySnapshot.forEach((doc) => {
            logs.push({ id: doc.id, ...doc.data() } as BirdLog);
        });
        
        // Client-side filtering and sorting
        const processedLogs = logs
            .filter(log => {
                if (!searchQuery) return true;
                // Since mystery logs don't have names, we only filter by date
                return new Date(log.timestamp).toLocaleDateString().includes(searchQuery);
            })
            .sort((a, b) => {
                switch (sortOption) {
                    case 'oldest':
                        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                    case 'newest':
                    default:
                        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                }
            });

        setAllLogs(processedLogs);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching mystery logs:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, sortOption, searchQuery]);


  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8 text-center flex flex-col items-center">
            <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mb-4" />
            <PageTitle>Loading Mystery Recordings...</PageTitle>
        </div>
    )
  }

  if (allLogs.length === 0 && !searchQuery) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
             <PageTitle>No Mystery Recordings Yet</PageTitle>
             <p className="mt-4 text-muted-foreground">Recordings that the AI can't identify can be saved here.</p>
             <Button className="mt-4" onClick={() => router.push('/record')}>
                Make a recording
            </Button>
        </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {allLogs.map((log) => (
        <Link href={`/log/${log.id}`} key={log.id}>
          <Card className="overflow-hidden h-full flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
            <CardContent className="p-0 flex-grow flex items-center justify-center bg-muted">
              <div className="aspect-square relative w-full flex items-center justify-center">
                 <Image
                  src={`https://picsum.photos/seed/mystery-${log.id}/400/400`}
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
      {allLogs.length === 0 && searchQuery && (
         <div className="col-span-full text-center py-16">
              <p className="text-lg text-muted-foreground">No results found for "{searchQuery}".</p>
         </div>
     )}
    </div>
  );
}
