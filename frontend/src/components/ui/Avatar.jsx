import { cn } from "../../lib/utils";

const sizes = { sm: "size-8", default: "size-10", lg: "size-12" };

export function Avatar({ size = "default", className, ...props }) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }) {
  return (
    <span
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-700",
        className,
      )}
      {...props}
    />
  );
}
