"use client";

import { useWindowSize } from '@/hooks/use-window-size';
import ResizePrompt from '@/components/layout/ResizePrompt';
import Footer from '@/components/layout/Footer';
import { Lightbulb, Speaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const MIN_WIDTH = 320;
const MIN_HEIGHT = 480;

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isTooSmall = useWindowSize(MIN_WIDTH, MIN_HEIGHT);
  const eggshellPattern = `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd' fill-opacity='0.1'%3E%3Cellipse fill='%236b4f2c' cx='60' cy='60' rx='5' ry='4.5'/%3E%3Cellipse fill='%239a7856' cx='20' cy='20' rx='4' ry='5'/%3E%3Cellipse fill='%236b4f2c' cx='100' cy='100' rx='5.5' ry='5'/%3E%3Cellipse fill='%23c7a788' cx='30' cy='90' rx='4' ry='3.5'/%3E%3Cellipse fill='%239a7856' cx='90' cy='30' rx='3.5' ry='4'/%3E%3Cellipse fill='%236b4f2c' cx='60' cy='20' rx='3' ry='2.5' transform='rotate(15 60 20)'/%3E%3Cellipse fill='%23c7a788' cx='20' cy='60' rx='2.5' ry='3' transform='rotate(-15 20 60)'/%3E%3Cellipse fill='%239a7856' cx='100' cy='60' rx='3' ry='3.5'/%3E%3Cellipse fill='%236b4f2c' cx='60' cy='100' rx='3.5' ry='3'/%3E%3Cellipse fill='%23c7a788' cx='10' cy='70' rx='2' ry='1.5' transform='rotate(30 10 70)'/%3E%3Cellipse fill='%239a7856' cx='110' cy='50' rx='1.5' ry='2' transform='rotate(-30 110 50)'/%3E%3Cellipse fill='%236b4f2c' cx='40' cy='110' rx='2.5' ry='2'/%3E%3Cellipse fill='%23c7a788' cx='80' cy='10' rx='2' ry='2.5'/%3E%3C/g%3E%3C/svg%3E")`;

  if (isTooSmall) {
    return <ResizePrompt />;
  }
  
  return (
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
      <main className="col-start-2 row-start-2 grid grid-rows-[1fr_3fr_1fr]">
        <div className="row-start-1 flex items-stretch justify-center p-4">
          <nav className="flex justify-evenly items-stretch w-full h-full gap-4">
            <Link href="#" passHref className="flex-1 flex justify-center items-center">
              <Button variant="nav" aria-label="Speaker">
                <Speaker className="h-2/3 w-2/3" />
              </Button>
            </Link>
            <div className="flex-1"></div>
            <Link href="#" passHref className="flex-1 flex justify-center items-center">
              <Button variant="nav" aria-label="Hint">
                <Lightbulb className="h-2/3 w-2/3" />
              </Button>
            </Link>
          </nav>
        </div>
        <div className="row-start-2 flex flex-col justify-center">{children}</div>
        <div className="row-start-3 flex items-stretch justify-center p-4">
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
  );
}
