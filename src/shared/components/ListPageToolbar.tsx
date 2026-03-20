"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type ListPageToolbarProps = {
  searchId: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchLabel?: string;
  filters?: ReactNode;
  end?: ReactNode;
  className?: string;
};

export function ListPageToolbar({
  searchId,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchLabel = "Tìm kiếm",
  filters,
  end,
  className,
}: ListPageToolbarProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-30 -mx-4 border-b border-white/55 bg-background/92 px-4 py-3 backdrop-blur-md dark:border-white/10 md:-mx-6 md:px-6",
        className,
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="relative w-full min-w-[12rem] sm:max-w-xs">
            <Label htmlFor={searchId} className="sr-only">
              {searchLabel}
            </Label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id={searchId}
              type="search"
              autoComplete="off"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 cursor-text pl-9"
            />
          </div>
          {filters ? (
            <div className="flex flex-wrap items-end gap-3">{filters}</div>
          ) : null}
        </div>
        {end ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {end}
          </div>
        ) : null}
      </div>
    </div>
  );
}
