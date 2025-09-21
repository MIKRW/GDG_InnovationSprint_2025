
import type { ReactNode } from 'react';

export function AppLayout({
  children,
  header,
}: {
  children: ReactNode;
  header?: ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {header}
      {children}
    </div>
  );
}
