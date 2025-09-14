
'use client';

import { PageTitle } from '@/components/content/PageTitle';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

const promptSections = [
    {
        id: 'newbie-mode',
        name: 'Newbie Mode Prompts',
        description: 'The core instructions for standard user identifications.',
        href: '/settings/prompts/bird-identifier/newbie',
    },
    {
        id: 'twitcher-mode',
        name: 'Twitcher Mode Prompts',
        description: 'Advanced instructions for high-fidelity analysis.',
        href: '/settings/prompts/bird-identifier/twitcher',
    }
];


export default function BirdIdentifierHubPage() {
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

    if (!isDevMode) {
        return (
             <div className="container mx-auto px-4 py-8">
                <p>This page is only available in developer mode.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <PageTitle>Bird Identifier AI</PageTitle>
            <p className="mb-8 max-w-2xl text-muted-foreground">
                Select a mode to edit the corresponding prompt. The Newbie and Twitcher modes use different underlying instructions to the AI.
            </p>

            <div className="space-y-4 max-w-2xl">
                {promptSections.map((section) => (
                    <Link href={section.href} key={section.id} className="block">
                        <Card className="hover:bg-accent transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-4">
                                        {section.name}
                                    </CardTitle>
                                    <CardDescription className="pt-1">{section.description}</CardDescription>
                                </div>
                                <ChevronRight className="h-6 w-6 text-muted-foreground" />
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
