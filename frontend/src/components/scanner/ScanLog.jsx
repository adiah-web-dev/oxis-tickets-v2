import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const meta = {
  "checked-in": {
    icon: CheckCircle2,
    label: "Checked in",
    className: "text-emerald-600",
  },
  valid: { icon: ShieldCheck, label: "Valid", className: "text-blue-600" },
  already: {
    icon: AlertTriangle,
    label: "Already used",
    className: "text-amber-600",
  },
  invalid: { icon: XCircle, label: "Invalid", className: "text-red-600" },
};

export function ScanLog({ entries }) {
  if (entries.length === 0)
    return (
      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
        Scans from this session will appear here.
      </p>
    );
  return (
    <ul className="divide-y">
      {entries.map((entry) => {
        const m = meta[entry.outcome];
        return (
          <li key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
            <m.icon className={`size-4 shrink-0 ${m.className}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {entry.holder ?? "Unknown ticket"}
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {entry.code}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-medium ${m.className}`}>{m.label}</p>
              <p className="text-[11px] tabular-nums text-muted-foreground">
                {format(entry.at, "HH:mm:ss")}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
