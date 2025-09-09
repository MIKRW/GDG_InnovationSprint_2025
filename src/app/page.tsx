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
          <path d="M16 3.01s-2.3 2.1-5.9 4.9c-2.3 1.8-4.2 3.8-5.7 5.3-2.6 2.6-2.5 6.8.3 9.4s6.8 2.8 9.4.3c1.5-1.5 3.5-3.4 5.3-5.7 2.8-3.6 4.9-5.9 4.9-5.9s-1-2.2-2.9-4.1c-2-2-4.1-2.9-4.1-2.9" />
          <path d="M12 12a3 3 0 1 0-4.2-4.2" />
        </svg>
        <h1 className="text-5xl md:text-6xl font-bold font-headline mt-4">
          ChirpID
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Your pocket guide to bird songs.</p>
      </div>
    </div>
  );
}
