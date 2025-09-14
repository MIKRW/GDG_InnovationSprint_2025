
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { PageTitle } from '@/components/content/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';

interface ErrorInstance {
    id: string;
    timestamp: string;
    errorDefinitionId: string;
    message: string;
    stackTrace?: string;
    context: Record<string, any>;
}

export default function ErrorLogPage() {
  const [errorInstances, setErrorInstances] = useState<ErrorInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    if (!isDevMode) return;

    const errorInstancesCollectionRef = collection(db, 'error_instances');
    const q = query(errorInstancesCollectionRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const instances: ErrorInstance[] = [];
        querySnapshot.forEach((doc) => {
            instances.push({ id: doc.id, ...doc.data() } as ErrorInstance);
        });
        setErrorInstances(instances);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [isDevMode]);


  if (!isDevMode) {
    return (
        <AppLayout header={<SecondaryHeader title="Not Found" />}>
            <main className="flex-1 p-4 text-center">
                <p>This page is not available.</p>
            </main>
            <SecondaryPageFooterV2 />
        </AppLayout>
    )
  }

  return (
    <>
        <PageTitle>Application Error Log</PageTitle>
        <p className="text-muted-foreground mb-6">
          This log contains all error instances captured by the application's logging service.
        </p>
        <div className="space-y-4">
            {loading && (
                <>
                    <Skeleton className="w-full h-48" />
                    <Skeleton className="w-full h-48" />
                </>
            )}
            {!loading && errorInstances.length === 0 && (
                <Card className="p-4">
                    <p className="text-muted-foreground">No errors have been logged yet. Any failures in operations like AI analysis will appear here.</p>
                </Card>
            )}
            {errorInstances.map((error) => (
                <Card key={error.id}>
                    <CardHeader>
                        <CardTitle className="text-xl flex justify-between items-center">
                           <span>{error.message}</span>
                           <Badge variant="destructive">{error.errorDefinitionId}</Badge>
                        </CardTitle>
                        <CardDescription>
                            {new Date(error.timestamp).toLocaleString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <h4 className="font-semibold text-sm">Context</h4>
                            <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                                {JSON.stringify(error.context, null, 2)}
                            </pre>
                        </div>
                        {error.stackTrace && (
                             <div>
                                <h4 className="font-semibold text-sm">Stack Trace</h4>
                                <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                                    {error.stackTrace}
                                </pre>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    </>
  );
}
