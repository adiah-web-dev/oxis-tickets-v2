import { Eye, Ticket as TicketIcon } from "lucide-react";
import { formatDate } from "../../lib/format";
import { ticketStatusMeta } from "../../lib/status";
import { DataTable } from "../common/DataTable";
import { EmptyState } from "../common/EmptyState";
import { StatusBadge } from "../common/StatusBadge";
import { Button } from "../ui/Button";
import { ticketTypeLabel } from "./TicketCard";

export function TicketsTable({
  rows,
  isLoading,
  isFetching,
  error,
  onRetry,
  onView,
  hideEvent,
  emptyDescription,
}) {
  const columns = [
    {
      key: "customer",
      header: "Customer",
      cell: (t) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {t.customer_name}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {t.order_number}
          </p>
        </div>
      ),
    },
    {
      key: "code",
      header: "Ticket code",
      cell: (t) => (
        <span className="font-mono text-[13px] text-slate-700">
          {t.ticket_code}
        </span>
      ),
    },
    ...(hideEvent
      ? []
      : [
          {
            key: "event",
            header: "Event",
            className: "hidden lg:table-cell",
            headerClassName: "hidden lg:table-cell",
            cell: (t) => <span className="text-slate-700">{t.event_name}</span>,
          },
        ]),
    {
      key: "type",
      header: "Type",
      className: "hidden md:table-cell",
      headerClassName: "hidden md:table-cell",
      cell: (t) => ticketTypeLabel(t),
    },
    {
      key: "issued",
      header: "Issued",
      className: "hidden xl:table-cell whitespace-nowrap text-muted-foreground",
      headerClassName: "hidden xl:table-cell",
      cell: (t) => formatDate(t.issued_at),
    },
    {
      key: "status",
      header: "Status",
      cell: (t) => <StatusBadge {...ticketStatusMeta[t.status]} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (t) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`View ticket ${t.ticket_code}`}
          onClick={(e) => {
            e.stopPropagation();
            onView(t);
          }}
        >
          <Eye className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(t) => t.id}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      onRetry={onRetry}
      onRowClick={onView}
      rowLabel={(t) => `View ticket ${t.ticket_code} for ${t.customer_name}`}
      emptyState={
        <EmptyState
          icon={TicketIcon}
          title="No tickets found"
          description={emptyDescription ?? "Try a different search or filter."}
        />
      }
    />
  );
}
