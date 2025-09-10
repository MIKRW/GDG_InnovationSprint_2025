import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/content/Logo';
import { Byline } from '@/components/content/Byline';

export function GridContainer({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-component="GridContainer"
      className={cn(
        'grid grid-cols-[1fr_1.6fr_1fr] grid-rows-[1fr_1.6fr_1fr] gap-4 p-4 bg-muted min-h-[calc(100vh-8rem)]',
        className
      )}
    >
      <div className="border border-dashed"></div>
      <div className="border border-dashed"></div>
      <div className="border border-dashed"></div>
      <div className="border border-dashed"></div>
      <div className="border border-dashed flex flex-col items-center justify-center">
        <div className="w-36 h-36">
          <Logo />
        </div>
        <Byline className="mt-6 text-2xl">Your Brand Tagline Here</Byline>
      </div>
      <div className="border border-dashed"></div>
      <div className="border border-dashed"></div>
      <div className="border border-dashed"></div>
      <div className="border border-dashed"></div>
    </div>
  );
}
