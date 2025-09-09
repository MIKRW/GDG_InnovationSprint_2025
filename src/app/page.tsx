"use client";

import { Bird } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-4">
      <div className="mb-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-24 w-24 mx-auto text-primary"
        >
          <path d="M12 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          <path d="M15.5 8.5c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5" />
          <path d="M9.5 8.5c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5" />
          <path d="M12 15s1.5-2 3-2 3 2 3 2" />
        </svg>
        <h1 className="text-5xl md:text-6xl font-bold font-headline mt-4">
          ChirpID
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Your pocket guide to bird songs.</p>
      </div>
    </div>
  );
}
