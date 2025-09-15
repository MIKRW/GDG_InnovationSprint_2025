
'use client';

import { ContrastButton } from '@/components/content/ContrastButton';
import { Home } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { SortOption } from '@/lib/types';

interface SearchableHeaderProps {
  title: string;
  onSearchChange: (query: string) => void;
  onSortChange: (option: SortOption) => void;
  showSearchAndSort: boolean;
}

export function SearchableHeader({
  title,
  onSearchChange,
  onSortChange,
  showSearchAndSort,
}: SearchableHeaderProps) {
  return (
    <header className="border-b flex items-center justify-between px-4 py-6 gap-4">
      <div className="flex items-center gap-2">
        <Link href="/" asChild>
          <Button variant="ghost" size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold hidden md:block">{title}</h1>
      </div>
      <div className="flex-1 flex items-center justify-center gap-2 max-w-lg">
        {showSearchAndSort && (
          <>
            <Input
              type="search"
              placeholder="Search logs..."
              className="bg-muted"
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <Select
              defaultValue="newest"
              onValueChange={(value) => onSortChange(value as SortOption)}
            >
              <SelectTrigger className="w-[180px] bg-muted">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Sort by Newest</SelectItem>
                <SelectItem value="oldest">Sort by Oldest</SelectItem>
                <SelectItem value="a-z">Sort by A-Z</SelectItem>
                <SelectItem value="z-a">Sort by Z-A</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ContrastButton />
      </div>
    </header>
  );
}
