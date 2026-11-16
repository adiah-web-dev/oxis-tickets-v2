import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

/** Order → payment → verification → tickets workflow indicator. */
export function OrderProgress({ steps, cancelled }) {
  const current = steps.findIndex((s) => !s.done);
  return (
    <ol
      className="grid grid-cols-2 gap-3 rounded-xl border bg-white p-4 sm:grid-cols-4"
      aria-label="Order progress"
    >
      {steps.map((step, i) => {
        const active = i === current && !cancelled;
        return (
          <li key={step.label} className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                step.done
                  ? "bg-emerald-600 text-white"
                  : active
                    ? "border-2 border-blue-600 text-blue-600"
                    : "border border-slate-200 text-slate-400",
              )}
              aria-hidden
            >
              {step.done ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={cn(
                "text-sm",
                step.done
                  ? "text-foreground"
                  : active
                    ? "font-medium text-blue-700"
                    : "text-muted-foreground",
              )}
            >
              {step.label}
              <span className="sr-only">
                {step.done ? " (complete)" : active ? " (current step)" : ""}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
