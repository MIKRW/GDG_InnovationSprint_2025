
import { AppLayout } from '@/components/layout/AppLayout';
import { SecondaryHeader } from '@/components/layout/SecondaryHeader';
import { SecondaryPageFooterV2 } from '@/components/layout/SecondaryPageFooterV2';
import { PageTitle } from '@/components/content/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Globe } from 'lucide-react';


export default function LocationSettingsPage() {
  return (
    <AppLayout header={<SecondaryHeader title="Location Settings" />}>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="container mx-auto">
            <PageTitle>Location Services</PageTitle>
            <p className="text-muted-foreground mb-6 max-w-2xl">
                Manage how ChirpID uses your location data. Enabling location services can significantly improve the accuracy of bird identifications.
            </p>

            <Card>
                <CardHeader>
                    <CardTitle>How We Use Your Location</CardTitle>
                    <CardDescription>
                        Your location is a powerful tool for identification.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                        <Globe className="h-8 w-8 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Smarter AI Analysis</h3>
                            <p className="text-muted-foreground">
                                When you provide a location with your recording, we tell the AI what region you're in. The AI can then cross-reference the bird song with known geographic ranges of different species. This helps it make a much more educated guess, as it can prioritize birds that are actually found in your area and deprioritize those that are not.
                            </p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="w-8 h-8 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold">Your Privacy</h3>
                            <p className="text-muted-foreground">
                                Your browser will always ask for your permission before accessing your location for the first time. Your coordinates are only saved with the recordings you make and are not used for any other purpose.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
      </main>
      <SecondaryPageFooterV2 />
    </AppLayout>
  );
}
