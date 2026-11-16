import { Clock, Loader2, MailCheck, MailX, RotateCw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useDeliveries, useRetryDelivery } from "../../hooks/useDeliveries";
import { formatDateTime } from "../../lib/format";
import { deliveryStatusMeta } from "../../lib/status";
import { cn } from "../../lib/utils";
import { ErrorState } from "../common/ErrorState";
import { StatusBadge } from "../common/StatusBadge";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";

const icons = { sent: MailCheck, pending: Clock, failed: MailX };

/** Ticket email deliveries for one order (GET /api/tickets/deliveries/?order=). */
export function DeliveryList({ orderId }) {
  const { can } = useAuth();
  const { data, isLoading, error, refetch } = useDeliveries({ order: orderId });
  const retry = useRetryDelivery();
  const deliveries = data?.results.filter(
    (d) => String(d.order) === String(orderId),
  );

  if (isLoading) return <Skeleton className="h-14 w-full" />;
  if (error && !data)
    return (
      <ErrorState error={error} onRetry={() => refetch()} className="py-6" />
    );
  if (!deliveries?.length)
    return (
      <p className="text-sm text-muted-foreground">
        Ticket emails are sent automatically once the order is confirmed.
      </p>
    );

  return (
    <ol className="space-y-4">
      {deliveries.map((d) => {
        const Icon = icons[d.status];
        return (
          <li key={d.id} className="flex gap-3">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border bg-white",
                d.status === "failed"
                  ? "border-red-200 text-red-600"
                  : d.status === "pending"
                    ? "border-amber-200 text-amber-600"
                    : "border-emerald-200 text-emerald-600",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge {...deliveryStatusMeta[d.status]} />
                <span className="text-xs text-muted-foreground">
                  {d.sent_at
                    ? formatDateTime(d.sent_at)
                    : formatDateTime(d.updated_at)}{" "}
                  · {d.attempts} attempt{d.attempts === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-slate-700">
                {d.recipient_email}
              </p>
              {d.last_error && (
                <p className="mt-1 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700">
                  {d.last_error}
                </p>
              )}
              {d.status === "failed" && can("retryDeliveries") && (
                <Button
                  variant="outline"
                  size="xs"
                  className="mt-2"
                  onClick={() => retry.mutate(d)}
                  disabled={retry.isPending}
                >
                  {retry.isPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <RotateCw className="size-3" />
                  )}{" "}
                  Retry delivery
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
