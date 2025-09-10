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
        'grid grid-cols-[1fr_1.6fr_1fr] grid-rows-[0.4fr_1.6fr_0.4fr] gap-4 p-4 bg-muted min-h-[calc(100vh-20rem)]',
        className
      )}
    >
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div className="flex flex-col items-center justify-center">
        {children || (
          <>
            <div className="w-[31.2rem] h-[31.2rem]">
              <Logo />
            </div>
            <Byline className="mt-6 text-2xl">the app name</Byline>
          </>
        )}
      </div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}
