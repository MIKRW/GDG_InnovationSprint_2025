"use client";

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
          <path d="M12,2C6.5,2,2,6.5,2,12s4.5,10,10,10s10-4.5,10-10S17.5,2,12,2z" />
          <path d="M12,18c-3.3,0-6-2.7-6-6s2.7-6,6-6" />
        </svg>
        <h1 className="text-5xl md:text-6xl font-bold font-headline mt-4">
          ChirpID
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Your pocket guide to bird songs.</p>
      </div>
    </div>
  );
}
