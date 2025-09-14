
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/content/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, Loader2 } from 'lucide-react';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppAIVersion, FullAppAIVersion, PromptContent, PromptVersion } from '@/lib/types';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const aiSystems = [
    {
        id: 'bird-identifier',
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
    const [activeVersionDetails, setActiveVersionDetails] = useState<FullAppAIVersion | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isDevMode) {
            setIsLoading(false);
            return;
        };

        async function fetchActiveVersionDetails() {
            setIsLoading(true);
            try {
                // 1. Get active version ID
                const configDoc = await getDoc(doc(db, 'app_ai_config', 'main'));
                if (!configDoc.exists()) throw new Error("App AI config not found.");
                const activeVersionId = configDoc.data().activeAppAIVersion;

                // 2. Get the active App AI Version manifest
                const versionDoc = await getDoc(doc(db, 'app_ai_versions', activeVersionId));
                if (!versionDoc.exists()) throw new Error("Active App AI Version document not found.");
                const versionData = versionDoc.data() as AppAIVersion;
                
                const systemDetailsPromises = Object.entries(versionData.systems).map(async ([systemId, promptVersionId]) => {
                    // 3. For each system, get its prompt version document
                    const promptVersionDoc = await getDoc(doc(db, 'prompt_versions', promptVersionId));
                    if (!promptVersionDoc.exists()) return null;
                    const promptVersionData = promptVersionDoc.data() as PromptVersion;

                    // 4. For each prompt version, get its content pieces
                    const contentPromises = Object.entries(promptVersionData.composedPrompts).map(async ([categoryId, contentId]) => {
                        const contentDoc = await getDoc(doc(db, 'prompt_content', contentId));
                        return contentDoc.exists() ? contentDoc.data() as PromptContent : null;
                    });
                    
                    const contents = (await Promise.all(contentPromises)).filter(Boolean) as PromptContent[];
                    
                    return {
                        id: systemId,
                        name: aiSystems.find(s => s.id === systemId || s.id.includes(systemId.split('-ai')[0]))?.name || systemId,
                        version: promptVersionData.version,
                        promptContents: contents,
                    };
                });
                
                const systems = (await Promise.all(systemDetailsPromises)).filter(Boolean) as FullAppAIVersion['systems'];

                setActiveVersionDetails({
                    id: versionData.id,
                    version: versionData.version,
                    systems: systems,
                });

            } catch (error) {
                console.error("Error fetching active version details:", error);
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchActiveVersionDetails();
    }, [isDevMode]);

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

             <div className="mt-12">
                <h2 className="text-2xl font-bold text-center mb-4">Active AI Configuration</h2>
                <Card>
                    <CardHeader>
                        {isLoading ? (
                            <div className="flex justify-center items-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : activeVersionDetails ? (
                            <div className="text-center">
                                <p className="text-muted-foreground">Current Live Version</p>
                                <p className="text-4xl font-bold">{activeVersionDetails.version}</p>
                            </div>
                        ) : (
                             <p className="text-center text-muted-foreground">No active AI version found.</p>
                        )}
                    </CardHeader>
                    <CardContent>
                        {activeVersionDetails && (
                            <Accordion type="single" collapsible className="w-full">
                                {activeVersionDetails.systems.map(system => (
                                    <AccordionItem value={system.id} key={system.id}>
                                        <AccordionTrigger className="text-lg">
                                            {system.name} <span className="ml-2 text-sm font-normal text-muted-foreground">(v{system.version})</span>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Prompt Category</TableHead>
                                                        <TableHead className="text-right">Content Version</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {system.promptContents.map(content => (
                                                        <TableRow key={content.id}>
                                                            <TableCell className="font-medium capitalize">{content.categoryId.replace(/_/g, ' ')}</TableCell>
                                                            <TableCell className="text-right">v{content.version}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
