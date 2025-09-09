"use client";

import Link from 'next/link';
import { Bird, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center p-4 h-full">
      <div className="mb-8">
        <Bird className="h-24 w-24 mx-auto text-primary" />
        <h1 className="text-5xl md:text-6xl font-bold font-headline mt-4">
          ChirpID
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Your pocket guide to bird songs.</p>
      </div>

      <Link href="/record" passHref>
        <Button size="lg">
          <Mic className="mr-2" />
          Start Identifying
        </Button>
      </Link>
    </div>
  );
}
