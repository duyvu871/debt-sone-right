import { cn } from "@/lib/utils";

export function FormAlert({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive",
        className,
      )}
    >
      {children}
    </div>
  );
}
