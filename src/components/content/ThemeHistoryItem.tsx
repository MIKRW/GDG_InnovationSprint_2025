'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Theme } from '@/lib/types';

interface ThemeHistoryItemProps {
  theme: Theme;
  onClick: () => void;
}

export function ThemeHistoryItem({ theme, onClick }: ThemeHistoryItemProps) {
  const { colors, words } = theme;

  const styles = {
    background: `hsl(${colors.background.h}, ${colors.background.s}%, ${colors.background.l}%)`,
    foreground: `hsl(${colors.foreground.h}, ${colors.foreground.s}%, ${colors.foreground.l}%)`,
    primary: `hsl(${colors.primary.h}, ${colors.primary.s}%, ${colors.primary.l}%)`,
  };

  return (
    <Card
      onClick={onClick}
      className={cn('cursor-pointer transition-all hover:scale-105 hover:shadow-lg')}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-4">
          <span>{words.background},</span>
          <span>{words.foreground},</span>
          <span>{words.primary}</span>
        </div>
        <div className="h-24 rounded-md flex overflow-hidden" style={{ backgroundColor: styles.background }}>
          <div className="w-1/3 h-full" style={{ backgroundColor: styles.foreground }}></div>
          <div className="w-1/3 h-full" style={{ backgroundColor: styles.primary }}></div>
        </div>
      </CardContent>
    </Card>
  );
}
