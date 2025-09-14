'use client';

import { PageTitle } from '@/components/content/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';

interface AISystem {
    id: string;
    name: string;
    description: string;
    activeVersion: string;
    href: string;
}

export default function PromptManagementPage() {
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    const [aiSystems, setAiSystems] = useState<AISystem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSystems() {
            if (!isDevMode) {
                setLoading(false);
                return;
            }
            try {
                const systemsSnapshot = await getDocs(collection(db, 'prompt_systems'));
                const systems = systemsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    href: `/settings/prompts/${doc.id.replace(/-ai$/, '')}`,
                    ...doc.data()
                })) as AISystem[];
                setAiSystems(systems);
            } catch (error) {
                console.error("Error fetching AI systems:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSystems();
    }, [isDevMode]);


    if (!isDevMode) {
        return (
             <div className="container mx-auto px-4 py-8">
                <p>This page is only available in developer mode.</p>
            </div>
        )
    }
     if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
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
                                        <Badge variant="secondary">{system.activeVersion}</Badge>
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
