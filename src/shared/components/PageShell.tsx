import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

/** Khung nội dung trang: căn giữa, max-w-7xl, padding & khoảng cách dọc thống nhất. */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl space-y-5 px-4 py-4 md:space-y-6 md:px-6 md:py-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
