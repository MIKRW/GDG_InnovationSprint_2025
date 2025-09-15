'use client';

import { PageTitle } from '@/components/content/PageTitle';
import { AppAIVersionManager } from '@/components/content/AppAIVersionManager';
import { PromptSystemVersionManager } from '@/components/content/PromptSystemVersionManager';
import { Separator } from '@/components/ui/separator';


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
            <PageTitle>AI Systems Publisher</PageTitle>
            <p className="text-muted-foreground mb-6 max-w-3xl">
                This is the central hub for managing the AI "brains" of the application. Use the top-level publisher to set a combination of AI systems live. Use the system-level publisher to create new versions of a specific AI system from its underlying prompt components.
            </p>

            <AppAIVersionManager />
            
            <Separator className="my-12" />

            <PromptSystemVersionManager />

        </div>
    )
}
