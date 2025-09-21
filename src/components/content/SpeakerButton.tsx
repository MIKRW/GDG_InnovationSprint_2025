
'use client';

import { Button } from '@/components/ui/button';
import { Speaker } from 'lucide-react';

export function SpeakerButton() {
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle Sound" className="h-20 w-20">
      <Speaker className="h-10 w-10" strokeWidth={2.5} />
    </Button>
  );
}
