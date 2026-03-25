"use client";

import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";

export type MutationSubmitButtonProps = Omit<
  ComponentProps<typeof Button>,
  "type"
> & {
  pending?: boolean;
  pendingLabel?: string;
};

export function MutationSubmitButton({
  pending = false,
  pendingLabel = "Đang xử lý…",
  children,
  className,
  disabled,
  ...props
}: MutationSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      className={cn(className)}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      ) : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}
