"use client";

import Logo from "@/components/chirp-id/Logo";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-4">
      <div className="mb-8">
        <Logo />
        <h1 className="text-5xl md:text-6xl font-bold font-headline mt-4">
          ChirpID
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Your pocket guide to bird songs.</p>
      </div>
    </div>
  );
}
