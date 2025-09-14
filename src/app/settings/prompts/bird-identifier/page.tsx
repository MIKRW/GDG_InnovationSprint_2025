
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/content/PageTitle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

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
    const router = useRouter();
    const [selectedMode, setSelectedMode] = useState(promptSections[0].href);

    if (!isDevMode) {
        return (
             <div className="container mx-auto px-4 py-8 text-center">
                <p>This page is only available in developer mode.</p>
            </div>
        )
    }
    
    const handleNavigation = () => {
        router.push(selectedMode);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <PageTitle>Bird Identifier AI</PageTitle>
                <p className="max-w-2xl mx-auto text-muted-foreground">
                    Select a mode to edit the corresponding prompt. The Newbie and Twitcher modes use different underlying instructions to the AI.
                </p>
            </div>

            <div className="flex justify-center">
                <Card className="w-full max-w-lg">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
                        <Select value={selectedMode} onValueChange={setSelectedMode}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select a mode to edit" />
                            </SelectTrigger>
                            <SelectContent>
                                {promptSections.map((section) => (
                                    <SelectItem key={section.id} value={section.href}>
                                        {section.name}
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
