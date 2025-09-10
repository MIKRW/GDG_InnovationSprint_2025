
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Theme } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Ban, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

interface ThemeHistoryItemProps {
  theme: Theme;
  onClick: () => void;
  onRotateClick?: () => void;
  isActive?: boolean;
  isSelected?: boolean;
  isEmpty?: boolean;
  emptyText?: string;
  showRotate?: boolean;
}

export function ThemeHistoryItem({
  theme,
  onClick,
  onRotateClick,
  isActive = false,
  isSelected = false,
  isEmpty = false,
  emptyText = "Generate a new theme or select a saved theme.",
  showRotate = false
}: ThemeHistoryItemProps) {
  const { colors, words } = theme;

  const styles = {
    background: `hsl(${colors.background.h}, ${colors.background.s}%, ${colors.background.l}%)`,
    foreground: `hsl(${colors.foreground.h}, ${colors.foreground.s}%, ${colors.foreground.l}%)`,
    primary: `hsl(${colors.primary.h}, ${colors.primary.s}%, ${colors.primary.l}%)`,
  };

  const handleRotateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRotateClick?.();
  }

  if (isEmpty) {
    return (
       <Card className={cn('border-dashed')}>
        <CardContent className="p-4 space-y-2 h-48 flex flex-col justify-center items-center text-muted-foreground">
            <Ban className="w-10 h-10" />
            <p className="text-sm font-medium">Empty</p>
            <p className="text-xs text-center">{emptyText}</p>
        </CardContent>
       </Card>
    )
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg',
        isActive && 'ring-2 ring-ring ring-offset-2',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
    >
      <CardContent className="p-4 space-y-2 relative">
        {isActive && <Badge className="absolute top-2 right-2">Active</Badge>}
        {showRotate && onRotateClick && (
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7"
                onClick={handleRotateClick}
                aria-label="Rotate Colors"
            >
                <RefreshCw className="w-4 h-4" />
            </Button>
        )}
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-4">
          <span>{words.word1},</span>
          <span>{words.word2},</span>
          <span>{words.word3}</span>
        </div>
        <div className="flex justify-center items-center text-xs text-muted-foreground">
            <span>({words.mood})</span>
        </div>
        <div className="h-24 rounded-md flex overflow-hidden" style={{ backgroundColor: styles.background }}>
          <div className="w-1/3 h-full" style={{ backgroundColor: styles.foreground }}></div>
          <div className="w-1/3 h-full" style={{ backgroundColor: styles.primary }}></div>
        </div>
      </CardContent>
    </Card>
  );
}
