'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { PrimaryHeader } from '@/components/layout/PrimaryHeader';
import { Loader2 } from 'lucide-react';

// This component now serves as a redirect to the new /log page.
export default function TestLogRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/log');
    }, [router]);

    return (
        <AppLayout header={<PrimaryHeader />}>
            <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold mb-2">Redirecting...</h1>
                <p className="text-muted-foreground">
                    Please wait while we take you to the new Bird Book page.
                </p>
            </main>
        </AppLayout>
    );
}
