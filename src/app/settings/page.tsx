
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/content/PageTitle';
import { useAuth } from '@/components/providers/AuthProvider';
import { LogOut, FlaskConical, Save } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { SecondaryPageFooter } from '@/components/layout/SecondaryPageFooter';
import { isDevMode } from '@/lib/utils';

const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAnonymous = user?.isAnonymous;
  const [hardware, setHardware] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedHardware = localStorage.getItem(HARDWARE_SETTINGS_KEY);
    if (savedHardware) {
      setHardware(savedHardware);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  const handleSaveHardware = () => {
    localStorage.setItem(HARDWARE_SETTINGS_KEY, hardware);
    toast({
      title: 'Settings Saved',
      description: 'Your recording hardware preference has been updated.',
    });
  };

  const showDevTools = isClient && isDevMode();

  return (
    <AppLayout header={<SecondaryHeader title="Settings" />} >
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="container mx-auto">
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
                <h2 className="text-lg font-semibold mb-2">Recording</h2>
                <div className="space-y-2">
                    <Label htmlFor="hardware-input">Recording Hardware</Label>
                    <Input
                        id="hardware-input"
                        value={hardware}
                        onChange={(e) => setHardware(e.target.value)}
                        placeholder="e.g., iPhone 15 Pro, Rode NTG"
                    />
                    <p className="text-sm text-muted-foreground">
                        Optionally, specify the microphone you use for recording.
                    </p>
                </div>
                <Button variant="outline" className="mt-4" onClick={handleSaveHardware}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Hardware
                </Button>
            </div>

            {showDevTools && (
              <div className="pt-8 w-full max-w-sm">
                  <h2 className="text-lg font-semibold mb-2">Developer</h2>
                    <Card className="bg-hazard-stripes p-1 rounded-lg">
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/settings/developer" className="bg-background rounded-sm p-4 flex items-center justify-center w-full">
                                <FlaskConical className="mr-2 h-4 w-4" />
                                <span>Developer Tools</span>
                            </Link>
                        </Button>
                    </Card>
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
      </main>
      <SecondaryPageFooter />
    </AppLayout>
  );
}
