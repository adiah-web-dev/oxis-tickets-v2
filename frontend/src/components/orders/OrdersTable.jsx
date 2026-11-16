import { Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatDate } from "../../lib/format";
import { orderStatusMeta } from "../../lib/status";
import { DataTable } from "../common/DataTable";
import { EmptyState } from "../common/EmptyState";
import { StatusBadge } from "../common/StatusBadge";

export const ticketCount = (o) =>
  o.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

export function OrdersTable({
  rows,
  isLoading,
  isFetching,
  error,
  onRetry,
  hideEvent,
  emptyState,
}) {
  const navigate = useNavigate();

  const columns = [
    {
      key: "customer",
      header: "Customer",
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {o.customer_name}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {o.order_number}
          </p>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      className: "hidden md:table-cell",
      headerClassName: "hidden md:table-cell",
      cell: (o) => (
        <div className="min-w-0 text-[13px]">
          <p className="truncate text-slate-700">{o.customer_email}</p>
          <p className="text-muted-foreground tabular-nums">
            {o.customer_phone}
          </p>
        </div>
      ),
    },
    ...(hideEvent
      ? []
      : [
          {
            key: "event",
            header: "Event",
            className: "hidden xl:table-cell",
            headerClassName: "hidden xl:table-cell",
            cell: (o) => <span className="text-slate-700">{o.event_name}</span>,
          },
        ]),
    {
      key: "tickets",
      header: "Tickets",
      className: "hidden sm:table-cell tabular-nums",
      headerClassName: "hidden sm:table-cell",
      cell: (o) => ticketCount(o),
    },
    {
      key: "total",
      header: "Total",
      className: "tabular-nums font-medium",
      cell: (o) => formatCurrency(o.total),
    },
    {
      key: "status",
      header: "Status",
      cell: (o) => <StatusBadge {...orderStatusMeta[o.status]} />,
    },
    {
      key: "date",
      header: "Date",
      className: "hidden lg:table-cell whitespace-nowrap text-muted-foreground",
      headerClassName: "hidden lg:table-cell",
      cell: (o) => formatDate(o.created_at),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(o) => o.id}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      onRetry={onRetry}
      onRowClick={(o) => navigate(`/orders/${o.id}`)}
      rowLabel={(o) => `Open order ${o.order_number} for ${o.customer_name}`}
      emptyState={
        emptyState ?? (
          <EmptyState
            icon={Receipt}
            title="No orders found"
            description="Try a different search or clear the filters."
          />
        )
      }
    />
  );
}
