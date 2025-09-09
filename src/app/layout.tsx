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
            <aside className="hidden md:block bg-eggshell" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath fill-rule='evenodd' d='M43.982 43.982c-6.627 6.627-17.38 6.627-24 0s-6.627-17.38 0-24c6.627-6.627 17.38-6.627 24 0s6.627 17.38 0 24zM16.5 16.5c-7.81 7.81-7.81 20.474 0 28.284s20.474 7.81 28.284 0c7.81-7.81 7.81-20.474 0-28.284s-20.474-7.81-28.284 0z'/%3E%3C/g%3E%3C/svg%3E")` }}></aside>
            <div className="flex-1 col-span-1 flex flex-col">
                <Header />
                <main className="flex-1">{children}</main>
            </div>
            <aside className="hidden md:block bg-eggshell" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath fill-rule='evenodd' d='M43.982 43.982c-6.627 6.627-17.38 6.627-24 0s-6.627-17.38 0-24c6.627-6.627 17.38-6.627 24 0s6.627 17.38 0 24zM16.5 16.5c-7.81 7.81-7.81 20.474 0 28.284s20.474 7.81 28.284 0c7.81-7.81 7.81-20.474 0-28.284s-20.474-7.81-28.284 0z'/%3E%3C/g%3E%3C/svg%3E")` }}></aside>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
