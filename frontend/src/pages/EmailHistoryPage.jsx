import { Loader2, Mail, MailX, RotateCw } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { DataTable } from "../components/common/DataTable";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge } from "../components/common/StatusBadge";
import { TablePagination } from "../components/common/TablePagination";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";
import { useAuth } from "../contexts/AuthContext";
import { useEventFilter } from "../contexts/EventFilterContext";
import { useDeliveries, useRetryDelivery } from "../hooks/useDeliveries";
import { useEvents } from "../hooks/useEvents";
import { formatDateTime } from "../lib/format";
import { deliveryStatusMeta, orderStatusMeta } from "../lib/status";

export function EmailHistoryPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "all";
  const { can } = useAuth();
  const { selectedEventId } = useEventFilter();
  const { data: events } = useEvents();
  const eventId = events?.some((e) => e.id === selectedEventId)
    ? (selectedEventId ?? undefined)
    : undefined;
  const [page, setPage] = useState(1);
  const [retrying, setRetrying] = useState(null);
  const retry = useRetryDelivery();

  const { data, isLoading, isFetching, error, refetch } = useDeliveries({
    status: status === "all" ? undefined : status,
    event: eventId,
    page,
  });
  const failed = useDeliveries({ status: "failed", event: eventId });

  const setStatus = (value) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete("status");
    else next.set("status", value);
    setParams(next, { replace: true });
    setPage(1);
  };

  const columns = [
    {
      key: "recipient",
      header: "Recipient",
      cell: (d) => (
        <p className="max-w-[220px] truncate font-medium text-foreground">
          {d.recipient_email}
        </p>
      ),
    },
    {
      key: "order",
      header: "Order",
      cell: (d) => (
        <div>
          <Link
            to={`/orders/${d.order}`}
            className="font-mono text-[13px] text-blue-600 hover:underline"
          >
            {d.order_number}
          </Link>
          <p className="text-xs text-muted-foreground">
            {orderStatusMeta[d.order_status]?.label ?? d.order_status}
          </p>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      className: "hidden lg:table-cell text-slate-700",
      headerClassName: "hidden lg:table-cell",
      cell: (d) => `Your tickets — ${d.order_number}`,
    },
    {
      key: "sent",
      header: "Sent",
      className: "hidden md:table-cell whitespace-nowrap text-muted-foreground",
      headerClassName: "hidden md:table-cell",
      cell: (d) => (d.sent_at ? formatDateTime(d.sent_at) : "—"),
    },
    {
      key: "attempts",
      header: "Attempts",
      className: "hidden sm:table-cell tabular-nums",
      headerClassName: "hidden sm:table-cell",
      cell: (d) => d.attempts,
    },
    {
      key: "status",
      header: "Status",
      cell: (d) => (
        <div className="max-w-[280px] space-y-1">
          <StatusBadge {...deliveryStatusMeta[d.status]} />
          {d.last_error && (
            <p className="whitespace-normal text-xs leading-snug text-red-600">
              {d.last_error}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-right",
      cell: (d) =>
        d.status === "failed" && can("retryDeliveries") ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRetrying(d)}
            disabled={retry.isPending && retrying?.id === d.id}
          >
            {retry.isPending && retrying?.id === d.id ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RotateCw className="size-3.5" />
            )}
            Retry
          </Button>
        ) : null,
    },
  ];

  const failedCount = failed.data?.count ?? 0;

  return (
    <div>
      <PageHeader description="Ticket emails sent by the server after orders are confirmed." />

      {failedCount > 0 && status !== "failed" && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2.5 text-sm text-red-800">
            <MailX className="size-4 shrink-0" aria-hidden />
            <span>
              <strong className="font-semibold">
                {failedCount} deliver{failedCount === 1 ? "y" : "ies"}
              </strong>{" "}
              failed. These customers may not have their tickets.
            </span>
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 bg-white text-red-700 hover:bg-red-100"
            onClick={() => setStatus("failed")}
          >
            Review failed
          </Button>
        </div>
      )}

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger
              className="h-9 bg-white sm:w-48"
              aria-label="Filter by delivery status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.keys(deliveryStatusMeta).map((s) => (
                <SelectItem key={s} value={s}>
                  {deliveryStatusMeta[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={data?.results}
          getRowId={(d) => d.id}
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          onRetry={() => refetch()}
          emptyState={
            <EmptyState
              icon={Mail}
              title="No deliveries found"
              description={
                status !== "all"
                  ? "Try a different status."
                  : "Ticket emails will appear here once orders are confirmed."
              }
            />
          }
        />
        {data && data.count > 0 && (
          <TablePagination
            page={page}
            count={data.count}
            hasNext={!!data.next}
            hasPrevious={!!data.previous}
            onPageChange={setPage}
            itemLabel="deliveries"
          />
        )}
      </Card>

      <ConfirmDialog
        open={!!retrying}
        onOpenChange={(open) => !open && setRetrying(null)}
        title="Retry ticket email?"
        description={
          retrying && (
            <>
              The server will try again to send the tickets for{" "}
              <strong className="text-foreground">
                {retrying.order_number}
              </strong>{" "}
              to{" "}
              <strong className="text-foreground">
                {retrying.recipient_email}
              </strong>
              .
            </>
          )
        }
        confirmLabel="Retry delivery"
        isPending={retry.isPending}
        onConfirm={() =>
          retrying &&
          retry.mutate(retrying, { onSettled: () => setRetrying(null) })
        }
      />
    </div>
  );
}
