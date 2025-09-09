import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'ChirpID',
  description: 'Identify birds by their song',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebAppCapable: 'yes',
  appleMobileWebAppStatusBarStyle: 'default',
  appleMobileWebAppTitle: 'ChirpID',
};

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          ptSans.variable
        )}
      >
        <div className="relative flex min-h-dvh flex-col">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_minmax(0,4fr)_1fr]">
            <aside className="hidden md:block bg-eggshell" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%235a524c' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2.5'/%3E%3Ccircle cx='10' cy='10' r='2.5'/%3E%3Ccircle cx='50' cy='50' r='2.5'/%3E%3Ccircle cx='15' cy='45' r='2'/%3E%3Ccircle cx='45' cy='15' r='2'/%3E%3Ccircle cx='30' cy='10' r='1.5'/%3E%3Ccircle cx='10' cy='30' r='1.5'/%3E%3Ccircle cx='50' cy='30' r='1.5'/%3E%3Ccircle cx='30' cy='50' r='1.5'/%3E%3Ccircle cx='5' cy='35' r='1'/%3E%3Ccircle cx='55' cy='25' r='1'/%3E%3Ccircle cx='20' cy='55' r='1'/%3E%3Ccircle cx='40' cy='5' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></aside>
            <div className="flex-1 col-span-1 flex flex-col">
                <Header />
                <main className="flex-1">{children}</main>
            </div>
            <aside className="hidden md:block bg-eggshell" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%235a524c' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2.5'/%3E%3Ccircle cx='10' cy='10' r='2.5'/%3E%3Ccircle cx='50' cy='50' r='2.5'/%3E%3Ccircle cx='15' cy='45' r='2'/%3E%3Ccircle cx='45' cy='15' r='2'/%3E%3Ccircle cx='30' cy='10' r='1.5'/%3E%3Ccircle cx='10' cy='30' r='1.5'/%3E%3Ccircle cx='50' cy='30' r='1.5'/%3E%3Ccircle cx='30' cy='50' r='1.5'/%3E%3Ccircle cx='5' cy='35' r='1'/%3E%3Ccircle cx='55' cy='25' r='1'/%3E%3Ccircle cx='20' cy='55' r='1'/%3E%3Ccircle cx='40' cy='5' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></aside>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
