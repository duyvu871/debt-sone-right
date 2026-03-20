import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type InfoItem = {
  label: string;
  value: ReactNode;
  className?: string;
};

export function InfoGrid({
  items,
  className,
}: {
  items: InfoItem[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className={cn("space-y-1", item.className)}>
          <dt className="text-xs font-medium text-muted-foreground">
            {item.label}
          </dt>
          <dd className="break-words text-sm font-medium text-foreground">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
