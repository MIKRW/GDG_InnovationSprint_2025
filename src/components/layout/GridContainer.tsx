import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/content/Logo';
import { AppName } from '@/components/content/Byline';

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
        'grid flex-1 grid-cols-[1fr_1.6fr_1fr] grid-rows-[0.4fr_1.6fr_0.4fr] gap-4 bg-muted p-4',
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
            <AppName className="mt-6 text-2xl">the app name</AppName>
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
