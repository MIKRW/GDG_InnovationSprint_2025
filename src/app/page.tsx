
import { AppLayout } from '@/components/layout/AppLayout';
import { Byline } from '@/components/content/Byline';
import { HomePageFooter } from '@/components/layout/HomePageFooter';
import { Logo } from '@/components/content/Logo';
import { PrimaryHeader } from '@/components/layout/PrimaryHeader';

export default function Home() {
  return (
    <AppLayout header={<PrimaryHeader />}>
      <main className="flex flex-1 flex-col items-center justify-center bg-muted p-4">
        <div className="w-[31.2rem] h-[31.2rem]">
          <Logo />
        </div>
        <Byline>the app name</Byline>
      </main>
      <HomePageFooter />
    </AppLayout>
  );
}
