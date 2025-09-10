import { ThemeSettings } from '@/components/content/ThemeSettings';

export function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Custom Theme Settings</h1>
      <ThemeSettings />
    </div>
  );
}
