import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <Footer />
    </div>
  );
}
