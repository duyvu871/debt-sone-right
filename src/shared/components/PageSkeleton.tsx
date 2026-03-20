"use client";

import { cn } from "@/lib/utils";
import { BentoGrid } from "@/shared/ui/bento-grid";

/** Khớp layout dashboard: khối trên (số liệu + biểu đồ), 3 ô điều hướng. */
const blocks = [
  { id: "dash-overview", className: "min-h-[22rem] lg:col-span-12" },
  { id: "dash-creditors", className: "h-36 lg:col-span-4" },
  { id: "dash-debts", className: "h-36 lg:col-span-4" },
  { id: "dash-repayments", className: "h-36 lg:col-span-4" },
] as const;

export function PageSkeleton() {
  return (
    <BentoGrid>
      {blocks.map(({ id, className: spanCls }) => (
        <div
          key={id}
          className={cn(
            "animate-pulse rounded-2xl border border-white/40 bg-white/35 dark:border-white/10 dark:bg-white/10",
            spanCls,
          )}
        />
      ))}
    </BentoGrid>
  );
}
