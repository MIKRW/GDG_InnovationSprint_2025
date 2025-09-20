
import { AppLayout } from '@/components/layout/AppLayout';
import { PageTitle } from '@/components/content/PageTitle';
import { HomePageFooter } from '@/components/layout/HomePageFooter';
import { Logo } from '@/components/content/Logo';
import { PrimaryHeader } from '@/components/layout/PrimaryHeader';
import type { Metadata, Viewport } from 'next';

// Since the root layout is now a client component, we move the metadata
// and viewport exports to the page component.
export const metadata: Metadata = {
  title: 'Lyre',
  description: 'An AI-powered bird song identifier',
  appleWebAppCapable: 'yes',
  appleMobileWebAppStatusBarStyle: 'default',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function Home() {
  return (
    <AppLayout header={<PrimaryHeader />}>
      <main className="flex flex-1 flex-col items-center justify-center bg-muted p-4">
        <div className="w-[31.2rem] h-[31.2rem]">
          <Logo />
        </div>
      </main>
      <HomePageFooter />
    </AppLayout>
  );
}
