
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/content/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight } from 'lucide-react';

const aiSystems = [
    {
        id: 'bird-identifier-ai',
        name: 'Bird Identifier AI',
        description: 'Manages all prompts related to identifying birds from audio.',
        href: '/settings/prompts/bird-identifier',
    },
    {
        id: 'theme-generator-ai',
        name: 'Theme Generation AI',
        description: 'Manages prompts related to generating UI color themes.',
        href: '/settings/prompts/theme-generator',
    },
    {
        id: 'image-generator-ai',
        name: 'Image Generation AI',
        description: 'Manages prompts for creating images of identified birds.',
        href: '/settings/prompts/image-generator',
    },
    {
        id: 'weather-ai',
        name: 'Weather Analysis AI',
        description: 'Manages prompts for interpreting weather data for identification.',
        href: '/settings/prompts/weather',
    }
];

export default function PromptManagementPage() {
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    const router = useRouter();
    const [selectedSystem, setSelectedSystem] = useState(aiSystems[0].href);

    const handleNavigation = () => {
        router.push(selectedSystem);
    };

    if (!isDevMode) {
        return (
             <div className="container mx-auto px-4 py-8">
                <p>This page is only available in developer mode.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <PageTitle>Prompt Management</PageTitle>
                <p className="max-w-2xl mx-auto text-muted-foreground">
                    Select an AI system to view, edit, and version its underlying prompts. Changes here directly affect AI behavior.
                </p>
            </div>

            <div className="flex justify-center">
                <Card className="w-full max-w-lg">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
                        <Select value={selectedSystem} onValueChange={setSelectedSystem}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select an AI System" />
                            </SelectTrigger>
                            <SelectContent>
                                {aiSystems.map((system) => (
                                    <SelectItem key={system.id} value={system.href}>
                                        {system.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleNavigation} className="w-full sm:w-auto">
                            Manage Prompts
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
