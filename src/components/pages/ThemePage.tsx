
import { ThemeGenerator } from '@/components/content/ThemeGenerator';
import { PageTitle } from '../content/PageTitle';

export function ThemePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <PageTitle>Generate theme with AI !</PageTitle>
        <p className="text-foreground mt-4 max-w-2xl mx-auto">
          Enter three words to inspire a color palette, select a mood, and let the AI create a unique theme. Save your favorite themes to one of the six slots below. Click a saved theme to make it active.
        </p>
      </div>
      <ThemeGenerator />
    </div>
  );
}
