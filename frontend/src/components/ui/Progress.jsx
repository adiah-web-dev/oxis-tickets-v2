import { cn } from "../../lib/utils";

/** The indicator is the direct child div, so callers can recolour it with `[&>div]:bg-…`. */
export function Progress({ value = 0, className, ...props }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-slate-100",
        className,
      )}
      {...props}
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
