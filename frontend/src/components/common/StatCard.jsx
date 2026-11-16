import { BoxIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";

const iconTones = {
  navy: "bg-navy-900 text-white",
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  slate: "bg-slate-100 text-slate-600",
};

export function StatCard({
  label,
  value,
  Icon = BoxIcon,
  hint,
  tone = "slate",
  isLoading,
  className,
}) {
  return (
    <Card className={cn("gap-0 p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            iconTones[tone],
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      {isLoading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </p>
      )}
      {hint && (
        <div className="mt-1.5 text-xs text-muted-foreground">
          {isLoading ? <Skeleton className="h-3 w-28" /> : hint}
        </div>
      )}
    </Card>
  );
}
