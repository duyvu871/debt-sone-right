"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import FadeContent from "@/shared/ui/fade-content";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

type BottomSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Giới hạn độ rộng trên desktop (`md+`, modal giữa màn hình). */
  desktopMaxWidthClass?: "sm" | "md" | "lg";
};

const desktopMaxW = {
  sm: "md:max-w-md",
  md: "md:max-w-lg",
  lg: "md:max-w-2xl",
} as const;

/**
 * Mobile: sheet trượt từ dưới. Desktop (`md+`): cùng primitive nhưng bố cục/kiểu modal căn giữa (SSR-safe, không đổi `side` sau hydrate).
 */
export function BottomSheet({
  open,
  title,
  onClose,
  children,
  desktopMaxWidthClass = "md",
}: BottomSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          "max-h-[88dvh] touch-pan-y overflow-y-auto rounded-t-[1.75rem] border border-white/70 bg-white/90 px-4 pb-8 pt-3 shadow-2xl backdrop-blur-2xl dark:border-border dark:bg-card/95",
          "md:inset-x-auto md:inset-y-auto md:bottom-auto md:left-1/2 md:top-1/2 md:h-auto md:max-h-[min(88vh,44rem)] md:w-[calc(100%-2rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:px-6 md:pb-6 md:pt-4 md:shadow-2xl",
          desktopMaxW[desktopMaxWidthClass],
        )}
        aria-describedby={undefined}
      >
        <div
          className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-muted md:hidden"
          aria-hidden
        />
        <div className="mb-4 flex items-center justify-between gap-3">
          <SheetTitle className="text-left text-lg font-semibold tracking-tight">
            {title}
          </SheetTitle>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Đóng
          </button>
        </div>
        <FadeContent
          trigger="mount"
          replayWhenOpen={open}
          fromY={14}
          duration={420}
          delay={0.045}
          ease="power2.out"
          className="min-h-0"
        >
          {children}
        </FadeContent>
      </SheetContent>
    </Sheet>
  );
}
