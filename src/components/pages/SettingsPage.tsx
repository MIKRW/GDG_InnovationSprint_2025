
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageTitle } from '../content/PageTitle';
import { useAuth } from '../providers/AuthProvider';
import { LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';


export function SettingsPage() {
  const { user } = useAuth();
  const isAnonymous = user?.isAnonymous;

  const handleSignOut = async () => {
    try {
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
