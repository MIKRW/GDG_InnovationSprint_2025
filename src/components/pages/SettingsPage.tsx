import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Customize the look and feel of your application.
        </p>
        <Button asChild variant="outline">
          <Link href="/theme">Customize Theme</Link>
        </Button>
      </div>
    </div>
  );
}
