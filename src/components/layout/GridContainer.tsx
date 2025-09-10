import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function GridContainer({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-component="GridContainer"
      className={cn('grid grid-cols-3 grid-rows-3 gap-4 p-4 flex-1', className)}
    >
      {children}
    </div>
  );
}
