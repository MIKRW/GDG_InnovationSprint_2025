'use client';

import { Button } from '@/components/ui/button';
import { Contrast } from 'lucide-react';

export function ContrastButton() {
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle Contrast">
      <Contrast className="h-5 w-5" />
    </Button>
  );
}
