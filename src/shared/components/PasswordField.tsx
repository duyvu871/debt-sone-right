import { cn } from "@/lib/utils";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function PasswordField({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>Mật khẩu thao tác</Label>
      <Input
        id={id}
        name="mutationPassword"
        type="password"
        autoComplete="off"
        required
      />
    </div>
  );
}
