import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Footer from '@/components/layout/Footer';

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
  const eggshellPattern = `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd' fill-opacity='0.1'%3E%3Cellipse fill='%236b4f2c' cx='60' cy='60' rx='5' ry='4.5'/%3E%3Cellipse fill='%239a7856' cx='20' cy='20' rx='4' ry='5'/%3E%3Cellipse fill='%236b4f2c' cx='100' cy='100' rx='5.5' ry='5'/%3E%3Cellipse fill='%23c7a788' cx='30' cy='90' rx='4' ry='3.5'/%3E%3Cellipse fill='%239a7856' cx='90' cy='30' rx='3.5' ry='4'/%3E%3Cellipse fill='%236b4f2c' cx='60' cy='20' rx='3' ry='2.5' transform='rotate(15 60 20)'/%3E%3Cellipse fill='%23c7a788' cx='20' cy='60' rx='2.5' ry='3' transform='rotate(-15 20 60)'/%3E%3Cellipse fill='%239a7856' cx='100' cy='60' rx='3' ry='3.5'/%3E%3Cellipse fill='%236b4f2c' cx='60' cy='100' rx='3.5' ry='3'/%3E%3Cellipse fill='%23c7a788' cx='10' cy='70' rx='2' ry='1.5' transform='rotate(30 10 70)'/%3E%3Cellipse fill='%239a7856' cx='110' cy='50' rx='1.5' ry='2' transform='rotate(-30 110 50)'/%3E%3Cellipse fill='%236b4f2c' cx='40' cy='110' rx='2.5' ry='2'/%3E%3Cellipse fill='%23c7a788' cx='80' cy='10' rx='2' ry='2.5'/%3E%3C/g%3E%3C/svg%3E")`;

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
        <div className="relative grid min-h-dvh grid-cols-[1fr_minmax(0,_10fr)_1fr] grid-rows-[1fr_minmax(0,_10fr)_1fr]">
          {/* Top-left */}
          <div className="bg-eggshell row-start-1 col-start-1" style={{ backgroundImage: eggshellPattern }}></div>
          {/* Top-center */}
          <div className="bg-eggshell row-start-1 col-start-2" style={{ backgroundImage: eggshellPattern }}></div>
          {/* Top-right */}
          <div className="bg-eggshell row-start-1 col-start-3" style={{ backgroundImage: eggshellPattern }}></div>

          {/* Middle-left */}
          <div className="bg-eggshell row-start-2 col-start-1" style={{ backgroundImage: eggshellPattern }}></div>
          {/* Center */}
          <main className="col-start-2 row-start-2 grid grid-rows-[3fr_4fr_3fr]">
            <div className="row-start-2 flex flex-col justify-center">{children}</div>
            <div className="row-start-3 flex items-center justify-center">
              <Footer />
            </div>
          </main>
          {/* Middle-right */}
          <div className="bg-eggshell row-start-2 col-start-3" style={{ backgroundImage: eggshellPattern }}></div>

          {/* Bottom-left */}
          <div className="bg-eggshell row-start-3 col-start-1" style={{ backgroundImage: eggshellPattern }}></div>
          {/* Bottom-center */}
          <div className="bg-eggshell row-start-3 col-start-2" style={{ backgroundImage: eggshellPattern }}></div>
          {/* Bottom-right */}
          <div className="bg-eggshell row-start-3 col-start-3" style={{ backgroundImage: eggshellPattern }}></div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
