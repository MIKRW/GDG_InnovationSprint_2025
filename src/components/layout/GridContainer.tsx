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
        'grid grid-cols-3 grid-rows-3 gap-4 p-4 bg-black min-h-[calc(100vh-8rem)]',
        className
      )}
    >
      <div className="border border-dashed"></div>
      <div className="border border-dashed"></div>
      <div className="border border-dashed"></div>
      <div className="border border-dashed"></div>
      <div className="border border-dashed flex flex-col items-center justify-center">
        <Logo />
        <Byline>Your Brand Tagline Here</Byline>
      </div>
      <div className="border border-dashed"></div>
      <div className="border border-dashed"></div>
      <div className="border border-dashed"></div>
      <div className="border border-dashed"></div>
    </div>
  );
}
