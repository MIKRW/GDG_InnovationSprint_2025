
'use client';

import { Button } from '@/components/ui/button';
import { Speaker } from 'lucide-react';

export function SpeakerButton() {
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle Sound" className="h-40 w-40">
      <Speaker className="h-32 w-32" strokeWidth={2.5} />
    </Button>
  );
}
