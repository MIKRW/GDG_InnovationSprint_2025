import { AppLayout } from '@/components/layout/AppLayout';
import { GridContainer } from '@/components/layout/GridContainer';
import { HomePageFooter } from '@/components/layout/HomePageFooter';
import { PrimaryHeader } from '@/components/layout/PrimaryHeader';

export default function Home() {
  return (
    <AppLayout header={<PrimaryHeader />}>
      <main className="flex-1 overflow-y-auto">
        <GridContainer />
      </main>
      <HomePageFooter />
    </AppLayout>
  );
}
