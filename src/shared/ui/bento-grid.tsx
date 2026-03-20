"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

import FadeContent from "@/shared/ui/fade-content";

/** Scrollable region for dense bento panels (tables / lists). */
export const bentoScrollClass =
  "max-h-[min(42vh,24rem)] touch-pan-y overflow-x-auto overflow-y-auto rounded-xl border border-white/50 bg-white/30 shadow-inner backdrop-blur-sm [scrollbar-color:rgba(148,163,184,0.45)_transparent] [scrollbar-width:thin] dark:border-white/10 dark:bg-white/5 dark:[scrollbar-color:rgba(148,163,184,0.35)_transparent] xl:max-h-[min(48vh,28rem)] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80";

export function BentoGrid({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 lg:auto-rows-fr lg:grid-cols-12 lg:gap-5 xl:gap-6",
        className,
      )}
      {...props}
    />
  );
}

/** Stagger in seconds for React Bits / GSAP `delay`. */
const staggerDelaySec = {
  none: 0,
  short: 0.07,
  medium: 0.13,
  long: 0.2,
} as const;

export type BentoStagger = keyof typeof staggerDelaySec;

type BentoPanelProps = React.ComponentProps<"div"> & {
  stagger?: BentoStagger;
};

export function BentoPanel({
  className,
  stagger = "none",
  children,
  ...props
}: BentoPanelProps) {
  return (
    <FadeContent
      trigger="mount"
      duration={520}
      ease="power2.out"
      delay={staggerDelaySec[stagger]}
      className={cn("min-h-0", className)}
      {...props}
    >
      {children}
    </FadeContent>
  );
}
