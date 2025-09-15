'use client';

import { PageTitle } from '@/components/content/PageTitle';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppAIVersionManager } from '@/components/content/AppAIVersionManager';

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

            <AppAIVersionManager />

            <div className="space-y-4 mt-8">
                {/* Existing systems will be listed here, this is a placeholder */}
                <Card>
                    <CardHeader>
                        <CardTitle>No AI Systems Defined</CardTitle>
                        <CardDescription>
                            The AI systems for this application will be configured here.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    )
}
