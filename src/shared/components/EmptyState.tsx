"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import FadeContent from "@/shared/ui/fade-content";

export function EmptyState({
  icon: Icon,
  title,
  description = "",
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <FadeContent
      trigger="mount"
      duration={440}
      ease="power2.out"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/55 bg-white/30 px-6 py-12 text-center backdrop-blur-sm dark:border-white/15 dark:bg-white/5",
        className,
      )}
    >
      <Icon
        className="size-11 text-muted-foreground/65"
        strokeWidth={1.5}
        aria-hidden
      />
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </FadeContent>
  );
}
