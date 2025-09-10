import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function RowContainer({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-component="RowContainer"
      className={cn('grid flex-1 grid-rows-3 gap-4 p-4', className)}
    >
      {children}
    </div>
  );
}
