
import type { ReactNode } from 'react';
import { PrimaryHeader } from './PrimaryHeader';

export function AppLayout({
  children,
  header,
}: {
  children: ReactNode;
  header?: ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {header || <PrimaryHeader />}
      {children}
    </div>
  );
}
