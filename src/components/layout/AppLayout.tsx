"use client";

import { useWindowSize } from '@/hooks/use-window-size';
import ResizePrompt from '@/components/layout/ResizePrompt';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import Speaker from '../chirp-id/icons/Speaker';
import Contrast from '../chirp-id/icons/Contrast';

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
    <div className="flex h-dvh w-full">
      {/* Textured Border - Left */}
      <div className="hidden md:block md:w-[10vw] lg:w-[15vw] xl:w-[20vw] bg-eggshell" style={{ backgroundImage: eggshellPattern }}></div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col max-w-full md:max-w-screen-sm mx-auto">
        <header className="flex justify-between items-center p-4">
          <Button variant="ghost" size="icon" aria-label="Toggle Sound">
            <Speaker className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Toggle Contrast">
            <Contrast className="h-6 w-6" />
          </Button>
        </header>
        <main className="flex-1 flex flex-col p-4 overflow-y-auto">
          {children}
        </main>
        <Footer />
      </div>

      {/* Textured Border - Right */}
      <div className="hidden md:block md:w-[10vw] lg:w-[15vw] xl:w-[20vw] bg-eggshell" style={{ backgroundImage: eggshellPattern }}></div>
    </div>
  );
}
