import type * as React from "react";

import { cn } from "@/lib/utils";

import { Input } from "./input";

/**
 * Ô nhập số tiền: tabular-nums, decimal keypad, tắt autofill/autocomplete của trình duyệt / password manager.
 */
function MoneyInput({
  className,
  autoComplete,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      autoComplete={autoComplete ?? "off"}
      autoCorrect="off"
      spellCheck={false}
      inputMode="decimal"
      data-form-type="other"
      data-1p-ignore="true"
      data-bwignore="true"
      data-lpignore="true"
      className={cn("tabular-nums", className)}
      {...props}
    />
  );
}

export { MoneyInput };
