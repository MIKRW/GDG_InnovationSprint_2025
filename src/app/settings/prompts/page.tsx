
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/content/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, Loader2, Save } from 'lucide-react';
import { doc, getDoc, collection, getDocs, query, where, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppAIVersion, FullAppAIVersion, PromptContent, PromptVersion, PromptSystem } from '@/lib/types';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { publishNewAppAIVersion, seedInitialPrompts } from '@/lib/actions';

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
    const { toast } = useToast();
    const [selectedSystem, setSelectedSystem] = useState(aiSystems[0].href);
    const [activeVersionDetails, setActiveVersionDetails] = useState<FullAppAIVersion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);
    const [needsMigration, setNeedsMigration] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);

    useEffect(() => {
        if (!isDevMode) {
            setIsLoading(false);
            return;
        };

        async function fetchActiveVersionDetails() {
            setIsLoading(true);
            try {
                 // Check if migration is needed
                const systemsCheck = await getDocs(query(collection(db, 'prompt_systems')));
                if (systemsCheck.empty) {
                    setNeedsMigration(true);
                    setIsLoading(false);
                    return;
                }
                setNeedsMigration(false);

                // 1. Get active version ID
                const configDoc = await getDoc(doc(db, 'app_ai_config', 'main'));
                if (!configDoc.exists()) {
                    setActiveVersionDetails(null);
                    setIsLoading(false);
                    return;
                }
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
    }, [isDevMode, isPublishing]);

    const handleNavigation = () => {
        router.push(selectedSystem);
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const newVersion = await publishNewAppAIVersion();
            
            toast({
                title: 'Published New AI Version!',
                description: `Successfully published ${newVersion.version}. The app will now use this configuration.`,
            });
             // The useEffect will re-run now because isPublishing is a dependency,
             // which will cause a re-fetch of the active version details.

        } catch (error) {
            console.error("Failed to publish new App AI version:", error);
            toast({ variant: 'destructive', title: 'Publish Failed' });
        } finally {
            setIsPublishing(false);
        }
    };

    const handleMigration = async () => {
        setIsMigrating(true);
        try {
            await seedInitialPrompts();
            toast({
                title: 'Migration Complete!',
                description: 'Initial prompts have been seeded to Firestore. The page will now reload.',
            });
            // Reload the page to fetch the new data
            window.location.reload();
        } catch (error) {
            console.error("Failed to seed initial prompts:", error);
            toast({ variant: 'destructive', title: 'Migration Failed', description: (error as Error).message });
            setIsMigrating(false);
        }
    };


    if (!isDevMode) {
        return (
             <div className="container mx-auto px-4 py-8">
                <p>This page is only available in developer mode.</p>
            </div>
        )
    }

    if (needsMigration) {
         return (
            <div className="container mx-auto px-4 py-8 text-center">
                <PageTitle>Prompt System Migration</PageTitle>
                <p className="max-w-2xl mx-auto text-muted-foreground mt-4">
                    The prompt management system is new and the database is empty. The existing prompts from the old `.txt` files need to be migrated into Firestore.
                </p>
                <Button onClick={handleMigration} disabled={isMigrating} className="mt-6">
                    {isMigrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Migrate Prompts to Firestore
                </Button>
            </div>
        );
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
                <div className="flex justify-center items-center mb-4 gap-4">
                     <h2 className="text-2xl font-bold text-center">Active AI Configuration</h2>
                     <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
                        {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Publish New Version
                    </Button>
                </div>
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
                             <div className="text-center p-8">
                                <p className="text-muted-foreground">No active AI version has been published yet.</p>
                                <p className="text-sm text-muted-foreground">Go to an editor, select prompt versions, and click "Publish" on that page.</p>
                            </div>
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

    