'use client';

import Image from 'next/image';
import { useBirdLog } from '@/lib/hooks/use-bird-log';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Trash2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export default function BirdLogClient() {
  const { loggedBirds, removeBirdFromLog, clearLog, isInitialized } = useBirdLog();

  if (!isInitialized) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-0">
              <Skeleton className="h-40 w-full rounded-t-lg" />
            </CardHeader>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (loggedBirds.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed rounded-lg">
        <h2 className="text-2xl font-semibold mb-2">Your Log is Empty</h2>
        <p className="text-muted-foreground">Start identifying birds to add them to your collection.</p>
      </div>
    );
  }

  return (
    <>
      {loggedBirds.length > 0 && (
          <div className="flex justify-end mb-4">
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Clear Log</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all entries from your bird log.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearLog}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loggedBirds.map((bird) => (
          <Card key={bird.scientificName} className="relative group overflow-hidden">
            <CardHeader className="p-0">
              <div className="relative aspect-video w-full">
                <Image
                  src={bird.imageUrl}
                  alt={bird.speciesName}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                  data-ai-hint={bird.dataAiHint}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="font-headline text-lg mb-1">{bird.speciesName}</CardTitle>
              <CardDescription className="italic text-sm">{bird.scientificName}</CardDescription>
            </CardContent>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeBirdFromLog(bird.scientificName)}
                aria-label={`Remove ${bird.speciesName}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
