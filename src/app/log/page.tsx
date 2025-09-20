'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PrimaryHeader } from '@/components/layout/PrimaryHeader';
import { HomePageFooter } from '@/components/layout/HomePageFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function BirdBookPage() {
    return (
        <AppLayout header={<PrimaryHeader />}>
            <main className="flex-1 flex items-center justify-center p-4 bg-muted">
                <Card className="w-full max-w-lg shadow-2xl">
                    <div className="relative w-full h-64">
                        <Image
                            src="https://picsum.photos/seed/birdbook/600/400"
                            alt="A collection of bird illustrations"
                            fill
                            className="object-cover rounded-t-lg"
                            data-ai-hint="birds nature"
                        />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-3xl">Bird Book</CardTitle>
                        <CardDescription className="text-lg italic">Your personal collection</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Each bird you successfully identify will be saved here. Build your collection over time and learn more about the birds you discover in your area.
                        </p>
                    </CardContent>
                </Card>
            </main>
            <HomePageFooter centerButtonLabel="Home Page" centerButtonHref="/" />
        </AppLayout>
    );
}
