import { Clock, Plus, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useOrderPayments } from "../../hooks/usePayments";
import {
  formatCurrency,
  formatDateTime,
  formatRelative,
  isPastDate,
  toNumber,
} from "../../lib/format";
import { paymentMethodLabels, paymentStatusMeta } from "../../lib/status";
import { ErrorState } from "../common/ErrorState";
import { StatusBadge } from "../common/StatusBadge";
import { PaymentReviewActions } from "../payments/PaymentReviewActions";
import { RecordPaymentDialog } from "../payments/RecordPaymentDialog";
import { Button } from "../ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Progress } from "../ui/Progress";
import { Skeleton } from "../ui/Skeleton";

export function OrderPaymentsCard({ order, openRecordOnLoad }) {
  const { can } = useAuth();
  const {
    data: payments,
    isLoading,
    error,
    refetch,
  } = useOrderPayments(order.id);
  const [recordOpen, setRecordOpen] = useState(false);

  const total = toNumber(order.total);
  const verified = (payments ?? [])
    .filter((p) => p.status === "verified")
    .reduce((s, p) => s + toNumber(p.amount), 0);
  const pending = (payments ?? [])
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + toNumber(p.amount), 0);
  const outstanding = Math.max(0, total - verified - pending);
  const expired = order.status === "pending" && isPastDate(order.expires_at);
  const canRecord =
    can("recordPayments") &&
    order.status === "pending" &&
    !expired &&
    outstanding > 0;

  useEffect(() => {
    if (openRecordOnLoad && canRecord && payments) setRecordOpen(true);
    // Only on first load of payments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRecordOnLoad, payments !== undefined]);

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-[15px]">Payments</CardTitle>
          <CardDescription>
            Verified {formatCurrency(verified)} of {formatCurrency(total)}
          </CardDescription>
        </div>
        {canRecord && (
          <Button size="sm" onClick={() => setRecordOpen(true)}>
            <Plus className="size-3.5" aria-hidden /> Record payment
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Progress
            value={total ? (verified / total) * 100 : 0}
            className="h-2 [&>div]:bg-emerald-500"
            aria-label="Verified payment progress"
          />
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground tabular-nums">
            <span>Awaiting verification: {formatCurrency(pending)}</span>
            <span>Outstanding: {formatCurrency(outstanding)}</span>
          </div>
        </div>

        {order.status === "pending" && order.expires_at && (
          <p
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${expired ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}
          >
            <Clock className="size-3.5 shrink-0" aria-hidden />
            {expired
              ? `This order expired ${formatRelative(order.expires_at)}.`
              : `Payment must be completed ${formatRelative(order.expires_at)} (${formatDateTime(order.expires_at)}).`}
          </p>
        )}

        {isLoading && <Skeleton className="h-16 w-full" />}
        {error && !payments && (
          <ErrorState
            error={error}
            onRetry={() => refetch()}
            className="py-6"
          />
        )}
        {payments && payments.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
            <Wallet className="size-5 text-slate-400" aria-hidden />
            No payments recorded yet.
          </div>
        )}
        {payments && payments.length > 0 && (
          <ul className="divide-y rounded-lg border">
            {payments.map((p) => (
              <li key={p.id} className="space-y-2 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(p.amount)}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {paymentMethodLabels[p.method] ?? p.method}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDateTime(p.created_at)}
                      {p.reference && ` · Ref ${p.reference}`}
                    </p>
                    {p.notes && (
                      <p className="mt-0.5 text-xs text-slate-600">{p.notes}</p>
                    )}
                  </div>
                  <StatusBadge {...paymentStatusMeta[p.status]} />
                </div>
                {p.status === "pending" && can("verifyPayments") && (
                  <PaymentReviewActions payment={p} />
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <RecordPaymentDialog
        order={order}
        outstanding={outstanding}
        open={recordOpen}
        onOpenChange={setRecordOpen}
      />
    </Card>
  );
}
