import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageTitle } from '../content/PageTitle';

export function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle>Settings</PageTitle>
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
