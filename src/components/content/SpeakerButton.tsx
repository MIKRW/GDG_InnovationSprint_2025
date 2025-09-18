'use client';

import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';

export function SpeakerButton() {
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle Sound">
      <Volume2 className="h-5 w-5" />
    </Button>
  );
}
