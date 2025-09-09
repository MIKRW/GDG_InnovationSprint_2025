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
            <aside className="hidden md:block bg-eggshell" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M2.5 5.5C3.32843 5.5 4 4.82843 4 4C4 3.17157 3.32843 2.5 2.5 2.5C1.67157 2.5 1 3.17157 1 4C1 4.82843 1.67157 5.5 2.5 5.5ZM32.5 35.5C33.3284 35.5 34 34.8284 34 34C34 33.1716 33.3284 32.5 32.5 32.5C31.6716 32.5 31 33.1716 31 34C31 34.8284 31.6716 35.5 32.5 35.5ZM12.5 15.5C13.3284 15.5 14 14.8284 14 14C14 13.1716 13.3284 12.5 12.5 12.5C11.6716 12.5 11 13.1716 11 14C11 14.8284 11.6716 15.5 12.5 15.5ZM22.5 25.5C23.3284 25.5 24 24.8284 24 24C24 23.1716 23.3284 22.5 22.5 22.5C21.6716 22.5 21 23.1716 21 24C21 24.8284 21.6716 25.5 22.5 25.5ZM5.5 32.5C6.32843 32.5 7 31.8284 7 31C7 30.1716 6.32843 29.5 5.5 29.5C4.67157 29.5 4 30.1716 4 31C4 31.8284 4.67157 32.5 5.5 32.5ZM35.5 8.5C36.3284 8.5 37 7.82843 37 7C37 6.17157 36.3284 5.5 35.5 5.5C34.6716 5.5 34 6.17157 34 7C34 7.82843 34.6716 8.5 35.5 8.5ZM15.5 2.5C16.3284 2.5 17 1.82843 17 1C17 0.171573 16.3284 -0.5 15.5 -0.5C14.6716 -0.5 14 0.171573 14 1C14 1.82843 14.6716 2.5 15.5 2.5ZM25.5 12.5C26.3284 12.5 27 11.8284 27 11C27 10.1716 26.3284 9.5 25.5 9.5C24.6716 9.5 24 10.1716 24 11C24 11.8284 24.6716 12.5 25.5 12.5Z'/%3E%3C/g%3E%3C/svg%3E")` }}></aside>
            <div className="flex-1 col-span-1 flex flex-col">
                <Header />
                <main className="flex-1">{children}</main>
            </div>
            <aside className="hidden md:block bg-eggshell" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M2.5 5.5C3.32843 5.5 4 4.82843 4 4C4 3.17157 3.32843 2.5 2.5 2.5C1.67157 2.5 1 3.17157 1 4C1 4.82843 1.67157 5.5 2.5 5.5ZM32.5 35.5C33.3284 35.5 34 34.8284 34 34C34 33.1716 33.3284 32.5 32.5 32.5C31.6716 32.5 31 33.1716 31 34C31 34.8284 31.6716 35.5 32.5 35.5ZM12.5 15.5C13.3284 15.5 14 14.8284 14 14C14 13.1716 13.3284 12.5 12.5 12.5C11.6716 12.5 11 13.1716 11 14C11 14.8284 11.6716 15.5 12.5 15.5ZM22.5 25.5C23.3284 25.5 24 24.8284 24 24C24 23.1716 23.3284 22.5 22.5 22.5C21.6716 22.5 21 23.1716 21 24C21 24.8284 21.6716 25.5 22.5 25.5ZM5.5 32.5C6.32843 32.5 7 31.8284 7 31C7 30.1716 6.32843 29.5 5.5 29.5C4.67157 29.5 4 30.1716 4 31C4 31.8284 4.67157 32.5 5.5 32.5ZM35.5 8.5C36.3284 8.5 37 7.82843 37 7C37 6.17157 36.3284 5.5 35.5 5.5C34.6716 5.5 34 6.17157 34 7C34 7.82843 34.6716 8.5 35.5 8.5ZM15.5 2.5C16.3284 2.5 17 1.82843 17 1C17 0.171573 16.3284 -0.5 15.5 -0.5C14.6716 -0.5 14 0.171573 14 1C14 1.82843 14.6716 2.5 15.5 2.5ZM25.5 12.5C26.3284 12.5 27 11.8284 27 11C27 10.1716 26.3284 9.5 25.5 9.5C24.6716 9.5 24 10.1716 24 11C24 11.8284 24.6716 12.5 25.5 12.5Z'/%3E%3C/g%3E%3C/svg%3E")` }}></aside>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
