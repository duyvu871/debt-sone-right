"use client";

import { useIsFetching, useIsMutating } from "@tanstack/react-query";

import { cn } from "@/lib/utils";

/**
 * Thin indeterminate bar at the top when any query or mutation is in flight.
 */
export function GlobalLoadingBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = fetching + mutating > 0;

  return (
    <div
      className={cn(
        "pointer-events-none fixed left-0 right-0 top-0 z-90 h-0.5 overflow-hidden transition-opacity duration-300",
        active ? "opacity-100" : "opacity-0",
      )}
      aria-hidden={!active}
    >
      <div
        className={cn(
          "h-full w-1/3 animate-[global-loading-slide_1.1s_ease-in-out_infinite] rounded-full",
          "bg-primary shadow-[0_0_8px_hsl(var(--primary))]",
        )}
      />
    </div>
  );
}
