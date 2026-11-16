import { cn } from "../../lib/utils";
import { Badge } from "../ui/Badge";

const toneClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
};

const dotClasses = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-slate-400",
};

export function StatusBadge({ label, tone, className }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 whitespace-nowrap font-medium",
        toneClasses[tone],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", dotClasses[tone])}
      />
      {label}
    </Badge>
  );
}
