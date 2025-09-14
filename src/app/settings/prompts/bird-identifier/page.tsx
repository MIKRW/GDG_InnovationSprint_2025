'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageTitle } from '@/components/content/PageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { savePromptContent } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PromptContent {
    id: string;
    systemId: string;
    categoryId: string;
    version: string;
    promptText: string;
    timestamp: any;
}

const SYSTEM_ID = 'bird-identifier-ai';

export default function BirdIdentifierPromptsPage() {
    const [promptCategories, setPromptCategories] = useState<Record<string, PromptContent>>({});
    const [editingState, setEditingState] = useState<Record<string, string>>({});
    const [savingState, setSavingState] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchLatestPrompts() {
            setLoading(true);
            try {
                // In a real versioning system, we'd fetch the `activeVersion` from the `prompt_systems` doc,
                // then get the specific prompt versions from the `prompt_versions` doc.
                // For now, we'll just get the latest version of each category for this system.
                const categories = ['base_instruction', 'location_handling', 'weather_handling'];
                const latestPrompts: Record<string, PromptContent> = {};

                for (const categoryId of categories) {
                    const q = query(
                        collection(db, 'prompt_content'),
                        where('systemId', '==', SYSTEM_ID),
                        where('categoryId', '==', categoryId),
                        orderBy('timestamp', 'desc')
                    );
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const doc = querySnapshot.docs[0];
                        latestPrompts[categoryId] = { id: doc.id, ...doc.data() } as PromptContent;
                    } else {
                        // Create a default if it doesn't exist.
                        const defaultContent = {
                            id: '',
                            systemId: SYSTEM_ID,
                            categoryId,
                            version: 'v1.0',
                            promptText: `This is the default prompt for ${categoryId}. Please edit.`,
                            timestamp: new Date()
                        };
                        latestPrompts[categoryId] = defaultContent;
                    }
                }
                setPromptCategories(latestPrompts);

                // Initialize editing state
                const initialEditingState: Record<string, string> = {};
                Object.keys(latestPrompts).forEach(catId => {
                    initialEditingState[catId] = latestPrompts[catId].promptText;
                });
                setEditingState(initialEditingState);

            } catch (error) {
                console.error("Error fetching prompts:", error);
                toast({ variant: 'destructive', title: 'Failed to load prompts.' });
            }
            setLoading(false);
        }
        fetchLatestPrompts();
    }, [toast]);

    const handleSave = async (categoryId: string) => {
        setSavingState(prev => ({ ...prev, [categoryId]: true }));
        const currentPrompt = promptCategories[categoryId];
        const newText = editingState[categoryId];

        if (newText === currentPrompt.promptText) {
             toast({ variant: 'default', title: 'No changes to save.' });
             setSavingState(prev => ({ ...prev, [categoryId]: false }));
             return;
        }

        try {
            const newVersionDoc = await savePromptContent({
                systemId: SYSTEM_ID,
                categoryId,
                promptText: newText,
                previousVersionId: currentPrompt.id,
                currentVersion: currentPrompt.version
            });
            
            // Optimistically update UI
            setPromptCategories(prev => ({
                ...prev,
                [categoryId]: {
                    ...newVersionDoc,
                    timestamp: new Date() // Use client date for immediate feedback
                } as PromptContent
            }));

            toast({ title: 'Prompt Saved!', description: `${categoryId} updated to ${newVersionDoc.version}` });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Save Failed', description: (error as Error).message });
        } finally {
             setSavingState(prev => ({ ...prev, [categoryId]: false }));
        }
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
            <div className="flex justify-between items-start">
                <div>
                    <PageTitle>Bird Identifier AI</PageTitle>
                    <p className="max-w-2xl text-muted-foreground">
                        Manage the individual prompt components that form the Bird Identifier AI. Each category is versioned independently.
                    </p>
                </div>
                 <Button disabled>
                    Save AI Version v1.1
                 </Button>
            </div>
            
            <div className="mt-8 space-y-8">
                {Object.entries(promptCategories).map(([categoryId, prompt]) => (
                    <Card key={categoryId}>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="capitalize">{categoryId.replace(/_/g, ' ')}</CardTitle>
                                <Badge variant="outline">Version: {prompt.version}</Badge>
                            </div>
                            <CardDescription>Last updated: {prompt.id ? new Date(prompt.timestamp.toDate()).toLocaleString() : 'Never'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Textarea 
                                value={editingState[categoryId] || ''}
                                onChange={(e) => setEditingState(prev => ({...prev, [categoryId]: e.target.value}))}
                                className="min-h-[200px] font-mono text-sm"
                             />
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="ghost">View History</Button>
                             <Button onClick={() => handleSave(categoryId)} disabled={savingState[categoryId]}>
                                {savingState[categoryId] ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Save {prompt.version}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
