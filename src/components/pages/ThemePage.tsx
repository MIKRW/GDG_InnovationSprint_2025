import { ThemeGenerator } from '@/components/content/ThemeGenerator';
import { PageTitle } from '../content/PageTitle';

export function ThemePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle>Generate theme with AI !</PageTitle>
      <ThemeGenerator />
    </div>
  );
}
