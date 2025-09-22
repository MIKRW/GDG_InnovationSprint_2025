
'use client';

import { ContrastButton } from '@/components/content/ContrastButton';
import { Home, Mic } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';
import { SpeakerButton } from '../content/SpeakerButton';
import { useSpeaker } from '@/hooks/use-speaker';

export function SecondaryHeader({ title, showSpeaker = false, narrationText = '' }: { title: string, showSpeaker?: boolean, narrationText?: string }) {
  const { playNarration, ...speakerProps } = useSpeaker(narrationText);

  return (
    <header className="border-b flex items-center justify-between px-4 py-2 h-20">
      <div className="flex-1 flex justify-start">
        {showSpeaker ? (
            <div className="opacity-50">
                <SpeakerButton onClick={() => playNarration()} {...speakerProps} />
            </div>
        ) : (
            <Link href="/record">
                <Button variant="ghost" size="icon" className="h-20 w-20">
                    <Mic className="h-16 w-16 text-foreground" />
                </Button>
            </Link>
        )}
      </div>

      <div className="flex-1 flex justify-center">
         <Link href="/">
            <Button variant="ghost" size="icon" className="h-20 w-20">
                <Home className="h-16 w-16 text-foreground" />
            </Button>
        </Link>
      </div>
      
      <div className="flex-1 flex justify-end">
        <div className="opacity-50">
            <ContrastButton />
        </div>
      </div>
    </header>
  );
}
