import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Settings className="h-8 w-8 mr-4" />
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
      </div>
      <div className="text-center py-20 border-2 border-dashed rounded-lg">
        <h2 className="text-2xl font-semibold mb-2">Settings Page</h2>
        <p className="text-muted-foreground">This page is under construction.</p>
      </div>
    </div>
  );
}
