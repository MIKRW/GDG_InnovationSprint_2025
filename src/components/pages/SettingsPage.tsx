
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageTitle } from '../content/PageTitle';
import { useAuth } from '../providers/AuthProvider';
import { LogOut, FlaskConical, Save } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';

const HARDWARE_SETTINGS_KEY = 'recording-hardware-setting';

export function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAnonymous = user?.isAnonymous;
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  const [hardware, setHardware] = useState('');

  useEffect(() => {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle>Settings</PageTitle>
      <div className="space-y-4 flex flex-col items-start">
        <p className="text-muted-foreground">
          Customize the look, feel, and functionality of your application.
        </p>
        <Link href="/theme" passHref>
          <Button asChild variant="outline">
            <a>Customize Theme</a>
          </Button>
        </Link>
        <Link href="/settings/location" passHref>
          <Button asChild variant="outline">
            <a>Location Settings</a>
          </Button>
        </Link>
         <Link href="/settings/mode" passHref>
          <Button asChild variant="outline">
            <a>App Mode</a>
          </Button>
        </Link>

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


        {isDevMode && (
          <div className="pt-8 w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-2">Developer Tools</h2>
              <Link href="/settings/prompts" passHref>
                <Card asChild className="bg-hazard-stripes p-1 rounded-lg cursor-pointer">
                    <a>
                        <div className="bg-background rounded-sm p-4 flex items-center">
                            <FlaskConical className="mr-2 h-4 w-4" />
                            <span>Prompt Management</span>
                        </div>
                    </a>
                </Card>
              </Link>
          </div>
        )}

        <div className="pt-8 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">Account</h2>
            {isAnonymous ? (
                 <Link href="/settings/register" passHref>
                    <Button asChild variant="outline">
                        <a>Create Account</a>
                    </Button>
                </Link>
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
