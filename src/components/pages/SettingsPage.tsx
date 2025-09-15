
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageTitle } from '../content/PageTitle';
import { useAuth } from '../providers/AuthProvider';
import { LogOut, FlaskConical } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { Card } from '../ui/card';


export function SettingsPage() {
  const { user } = useAuth();
  const isAnonymous = user?.isAnonymous;
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  const handleSignOut = async () => {
    try {
      const auth = getAuth(); // Create instance on client, only when needed
      await signOut(auth);
      // The AuthProvider will handle signing the user back in anonymously
      window.location.reload(); // Reload to ensure clean state
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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

        {isDevMode && (
          <div className="pt-8 w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-2">Developer Tools</h2>
                <Button asChild variant="outline">
                  <Link href="/settings/prompts"><FlaskConical className="mr-2 h-4 w-4" />Prompt Management</Link>
                </Button>
          </div>
        )}

        <div className="pt-8 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">Account</h2>
            {isAnonymous ? (
                 <Button asChild variant="outline">
                    <Link href="/settings/register">Create Account</Link>
                </Button>
            ) : (
                <div className="space-y-4">
                    <p className="text-muted-foreground">You are signed in as {user?.email}.</p>
                    <Button variant="destructive" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
