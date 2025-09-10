'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import placeholderImages from '@/lib/placeholder-images.json';
import { PageTitle } from '../content/PageTitle';

export function LogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle>Photo Album</PageTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {placeholderImages.log.map((image) => (
          <Card key={image.seed} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square relative w-full">
                <Image
                  src={`https://picsum.photos/seed/${image.seed}/400/400`}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  data-ai-hint={image.hint}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
