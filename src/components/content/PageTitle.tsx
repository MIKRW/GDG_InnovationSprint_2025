import type { ReactNode } from 'react';

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-6xl font-bold mb-6">{children}</h1>;
}
