import { AppLayout } from '@/components/layout/AppLayout';
import { GridContainer } from '@/components/layout/GridContainer';
import { HomePageFooter } from '@/components/layout/HomePageFooter';

export default function Home() {
  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <GridContainer />
      </main>
      <HomePageFooter />
    </AppLayout>
  );
}
