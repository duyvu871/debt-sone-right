"use client";

import { History, Home, Users, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "radix-ui";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type DockItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  match: (pathname: string) => boolean;
};

const items: DockItem[] = [
  {
    href: "/",
    label: "Trang chủ",
    Icon: Home,
    match: (p) => p === "/",
  },
  {
    href: "/creditors",
    label: "Chủ nợ",
    Icon: Users,
    match: (p) => p === "/creditors" || p.startsWith("/creditors/"),
  },
  {
    href: "/debts",
    label: "Khoản nợ",
    Icon: WalletCards,
    match: (p) => p === "/debts" || p.startsWith("/debts/"),
  },
  {
    href: "/repayments",
    label: "Lịch sử trả nợ",
    Icon: History,
    match: (p) => p === "/repayments" || p.startsWith("/repayments/"),
  },
];

/**
 * Dock kiểu macOS: nền thanh dock trong suốt (glass); icon/nút/tooltip màu đặc.
 */
export function AppDock() {
  const pathname = usePathname();

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
      aria-label="Điều hướng chính"
    >
      <Tooltip.Provider delayDuration={180} skipDelayDuration={200}>
        <div
          className={cn(
            "pointer-events-auto flex items-center gap-0.5 rounded-[1.75rem] border border-white/30 bg-white/15 px-1.5 py-1.5 shadow-[0_8px_40px_-12px_rgb(45_74_83/0.15)] backdrop-blur-xl backdrop-saturate-150",
            "dark:border-white/10 dark:bg-zinc-950/20 dark:shadow-[0_12px_48px_-16px_rgb(0_0_0/0.3)]",
          )}
        >
          {items.map(({ href, label, Icon, match }) => {
            const active = match(pathname);
            return (
              <Tooltip.Root key={href}>
                <Tooltip.Trigger asChild>
                  <Link
                    href={href}
                    className={cn(
                      "relative flex size-12 items-center justify-center rounded-2xl transition-[transform,background-color,color] duration-200 md:size-14",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm dark:bg-primary dark:text-primary-foreground"
                        : "text-muted-foreground hover:bg-white hover:text-foreground dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="sr-only">{label}</span>
                    <Icon
                      className="size-[1.35rem] md:size-6"
                      strokeWidth={active ? 2.75 : 2.45}
                      aria-hidden
                    />
                  </Link>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="top"
                    sideOffset={10}
                    className={cn(
                      "z-10000 max-w-48 rounded-xl border border-border bg-popover px-2.5 py-1.5 text-center text-xs font-medium text-popover-foreground shadow-lg",
                      "dark:bg-zinc-900 dark:text-zinc-50 dark:border-zinc-700",
                    )}
                  >
                    {label}
                    <Tooltip.Arrow className="fill-popover dark:fill-zinc-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          })}
        </div>
      </Tooltip.Provider>
    </nav>
  );
}
