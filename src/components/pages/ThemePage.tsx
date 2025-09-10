import { ThemeGenerator } from '@/components/content/ThemeGenerator';

export function ThemePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Generate theme with AI !</h1>
      <ThemeGenerator />
    </div>
  );
}
