
'use client';

import { PageTitle } from '@/components/content/PageTitle';

export default function BirdIdentifierPromptEditorPage() {
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
            <PageTitle>Bird Identifier AI Editor</PageTitle>
            <p className="text-muted-foreground mb-6 max-w-3xl">
                This is where the editor for the Bird Identifier AI will be built.
            </p>
        </div>
    )
}
