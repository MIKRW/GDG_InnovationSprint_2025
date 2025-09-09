"use client";

import Logo from "@/components/chirp-id/Logo";
import Byline from "@/components/chirp-id/Byline";

export default function LandingPage() {
  return (
    <div className="flex flex-col h-full items-center justify-center text-center">
      <div className="flex-1 flex items-end justify-center pb-4">
        <Logo />
      </div>
      <div className="flex-1 flex flex-col items-center justify-start pt-4">
        <h1 className="text-5xl md:text-6xl font-bold font-headline">
          ChirpID
        </h1>
        <Byline />
      </div>
    </div>
  );
}
