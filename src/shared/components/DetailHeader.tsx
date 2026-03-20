import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DetailHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function DetailHeader({
  title,
  subtitle,
  badge,
  actions,
  className,
}: DetailHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {title}
          {badge}
        </div>
        {subtitle ? (
          <div className="text-sm text-foreground/80">{subtitle}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
