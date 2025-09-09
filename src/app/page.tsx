"use client";

import Logo from "@/components/chirp-id/Logo";
import Byline from "@/components/chirp-id/Byline";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <Logo />
      <h1 className="text-5xl md:text-6xl font-bold font-headline mt-4">
        ChirpID
      </h1>
      <Byline />
    </div>
  );
}
