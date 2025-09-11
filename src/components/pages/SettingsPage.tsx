
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageTitle } from '../content/PageTitle';

export function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle>Settings</PageTitle>
      <div className="space-y-4 flex flex-col items-start">
        <p className="text-muted-foreground">
          Customize the look, feel, and functionality of your application.
        </p>
        <Button asChild variant="outline">
          <Link href="/theme">Customize Theme</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/settings/location">Location Settings</Link>
        </Button>
         <Button asChild variant="outline">
          <Link href="/settings/mode">App Mode</Link>
        </Button>
      </div>
    </div>
  );
}
