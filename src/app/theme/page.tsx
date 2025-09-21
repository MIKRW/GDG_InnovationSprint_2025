
'use client';

import { ThemePage } from '@/components/pages/ThemePage';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { AppLayout } from '@/components/layout/AppLayout';
import { SpeakerButton } from '@/components/content/SpeakerButton';
import { ContrastButton } from '@/components/content/ContrastButton';
import { useSpeaker } from '@/hooks/use-speaker';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const PAGE_NARRATION = "This is the Theme page. You can generate a custom user interface theme using AI by providing three inspirational words and selecting a mood. Or, use the manual editor to fine-tune the colors precisely. Save your creations to one of the six slots at the bottom.";


export default function Theme() {
  const { playNarration, ...speakerProps } = useSpeaker(PAGE_NARRATION);

  return (
    <AppLayout>
       <header className="border-b flex items-center justify-between px-4 py-2 h-20">
            <div className="opacity-50">
                <SpeakerButton onClick={() => playNarration()} {...speakerProps} />
            </div>
             <Link href="/">
                <Button variant="ghost" size="icon" className="h-20 w-20">
                    <Home className="h-16 w-16 text-foreground" />
                </Button>
            </Link>
            <div className="opacity-50">
                <ContrastButton />
            </div>
      </header>
      <main className="flex-1 overflow-y-auto bg-muted">
        <div data-component="ThemeGeneratorContainer" className="h-full">
          <ThemePage />
        </div>
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}

