'use client';

import { PageTitle } from '@/components/content/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

// NOTE: This has been reverted to a static page to ensure stability.
// The AI system list is hardcoded here. A future improvement could be to
// dynamically load this from a 'prompt_systems' collection if needed.

const aiSystems = [
    {
        id: 'bird-identifier-ai',
        name: 'Bird Identifier AI',
        description: 'Manages all prompts related to identifying birds from audio.',
        href: '/settings/prompts/bird-identifier',
        activeVersion: 'v1.0' // Placeholder
    },
    {
        id: 'theme-generator-ai',
        name: 'Theme Generation AI',
        description: 'Manages prompts related to generating UI color themes.',
        href: '/settings/prompts/theme-generator',
        activeVersion: 'v1.0' // Placeholder
    },
    {
        id: 'image-generator-ai',
        name: 'Image Generation AI',
        description: 'Manages prompts for creating images of identified birds.',
        href: '/settings/prompts/image-generator',
        activeVersion: 'v1.0' // Placeholder
    },
    {
        id: 'weather-ai',
        name: 'Weather Analysis AI',
        description: 'Manages prompts for interpreting weather data for identification.',
        href: '/settings/prompts/weather',
        activeVersion: 'v1.0' // Placeholder
    }
];


export default function PromptManagementPage() {
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
            <PageTitle>Prompt Management</PageTitle>
            <p className="mb-8 max-w-2xl text-muted-foreground">
                Select an AI system to view, edit, and version its underlying prompts. Changes here directly affect AI behavior.
            </p>

            <div className="space-y-4 max-w-2xl">
                {aiSystems.map((system) => (
                    <Link href={system.href} key={system.href} className="block">
                        <Card className="hover:bg-accent transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-4">
                                        {system.name}
                                    </CardTitle>
                                    <CardDescription className="pt-1">{system.description}</CardDescription>
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
