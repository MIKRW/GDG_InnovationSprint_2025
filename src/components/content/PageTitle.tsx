
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function PageTitle({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <h1
      data-component="PageTitle"
      className={cn('text-6xl font-bold mb-6', className)}
    >
      {children}
    </h1>
  );
}
