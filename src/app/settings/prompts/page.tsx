
'use client';

import { PageTitle } from '@/components/content/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

const aiSystems = [
    {
        href: '/settings/prompts/bird-identifier',
        title: 'Bird Identifier AI',
        description: 'Manages prompts for identifying birds from audio, including location and weather handling.',
    },
    {
        href: '/settings/prompts/theme-generator',
        title: 'Theme Generation AI',
        description: 'Controls how the AI generates color palettes from user input words and moods.',
    },
    {
        href: '/settings/prompts/image-generator',
        title: 'Image Generation AI',
        description: 'Defines the prompts used by Imagen 4 to create bird images from text descriptions.',
    },
    {
        href: '/settings/prompts/weather',
        title: 'Weather Analysis AI',
        description: 'Defines how the AI should interpret and use weather data in its analysis.',
    },
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
                                    <CardTitle>{system.title}</CardTitle>
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
