import { cn } from "../../lib/utils";

const variants = {
  default: "border-transparent bg-blue-600 text-white",
  outline: "border-slate-200 bg-white text-slate-700",
  secondary: "border-transparent bg-slate-100 text-slate-700",
  destructive: "border-transparent bg-red-600 text-white",
};

export function Badge({ variant = "default", className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
