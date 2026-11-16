import { ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";

import { formatNumber } from "../../lib/format";

export function CheckInProgressCard({
  checkedIn,
  total,
  isLoading,
  scopeLabel,
}) {
  const pct = total ? Math.round((checkedIn / total) * 100) : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-[15px]">Check-in progress</CardTitle>
        <CardDescription>{scopeLabel}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {isLoading ? (
          <Skeleton className="mx-auto size-36 rounded-full" />
        ) : (
          <div
            className="relative mx-auto size-36"
            role="img"
            aria-label={`${pct}% of tickets checked in`}
          >
            <svg viewBox="0 0 120 120" className="size-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#16a34a"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                className="transition-[stroke-dashoffset] duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-semibold tabular-nums text-navy-900">
                {pct}%
              </span>
              <span className="text-[11px] text-muted-foreground">
                checked in
              </span>
            </div>
          </div>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-emerald-50/60 px-3 py-2.5">
            <dt className="flex items-center gap-1.5 text-xs text-emerald-800">
              <span
                className="size-2 rounded-full bg-emerald-500"
                aria-hidden
              />{" "}
              Arrived
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {isLoading ? "-" : formatNumber(checkedIn)}
            </dd>
          </div>
          <div className="rounded-lg border bg-slate-50 px-3 py-2.5">
            <dt className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="size-2 rounded-full bg-slate-300" aria-hidden />{" "}
              Expected
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {isLoading ? "-" : formatNumber(total - checkedIn)}
            </dd>
          </div>
        </dl>

        <Button variant="outline" asChild className="mt-4 w-full">
          <Link to="/scanner">
            <ScanLine className="size-4" aria-hidden /> Open scanner
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
