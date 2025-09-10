import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function Byline({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p data-component="Byline" className={cn('mt-4 text-lg text-muted-foreground', className)}>
      {children}
    </p>
  );
}
