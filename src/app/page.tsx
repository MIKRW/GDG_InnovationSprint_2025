
import { AppLayout } from '@/components/layout/AppLayout';
import { AppName } from '@/components/content/AppName';
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
        <AppName>the app name</AppName>
      </main>
      <HomePageFooter />
    </AppLayout>
  );
}
