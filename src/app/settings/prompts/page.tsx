
'use client';

import { PageTitle } from '@/components/content/PageTitle';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const aiSystems = [
    
];

export default function PromptManagementPage() {
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

    if (!isDevMode) {
        return (
            <div className="flex-1 p-4 text-center">
                <p>This page is not available.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto">
            <PageTitle>AI Systems</PageTitle>
            <p className="text-muted-foreground mb-6 max-w-3xl">
                This is the central hub for managing the AI "brains" of the application. Each system below represents a major AI functionality. Select a system to edit its underlying prompts, create new versions, and manage which version is active.
            </p>

            <div className="space-y-4">
                {aiSystems.length > 0 ? aiSystems.map(system => (
                    <Link href={system.href} key={system.id} asChild>
                        <Card className="hover:border-primary transition-colors cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>{system.name}</CardTitle>
                                    <CardDescription className="pt-1">{system.description}</CardDescription>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            </CardHeader>
                        </Card>
                    </Link>
                )) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>No AI Systems Defined</CardTitle>
                            <CardDescription>
                                The AI systems for this application will be configured here.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>
        </div>
    )
}
