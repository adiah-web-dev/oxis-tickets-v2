import { Eye, Loader2, QrCode } from "lucide-react";
import { useTicketQr } from "../../hooks/useTickets";
import { formatDateTime } from "../../lib/format";
import { ticketStatusMeta } from "../../lib/status";
import { cn } from "../../lib/utils";
import { StatusBadge } from "../common/StatusBadge";
import { Button } from "../ui/Button";

export const ticketTypeLabel = (t) => t.ticket_type_name ?? t.ticket_type;

/** Visual ticket using the backend-generated QR image. */
export function TicketCard({
  ticket,
  onView,
  size = "default",
  showQr = true,
  className,
}) {
  const lg = size === "lg";
  const qr = useTicketQr(ticket.id, showQr);

  return (
    <article
      aria-label={`Ticket ${ticket.ticket_code}`}
      className={cn(
        "overflow-hidden rounded-xl border bg-white shadow-[0_1px_2px_rgba(15,31,61,0.04)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 bg-navy-900 px-4 py-2.5 text-white">
        <p className="min-w-0 truncate text-sm font-semibold">
          {ticket.event_name}
        </p>
        <span className="shrink-0 rounded border border-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-200">
          Admit one
        </span>
      </div>

      <div className="flex gap-4 p-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Customer
            </p>
            <p
              className={cn(
                "truncate font-semibold",
                lg ? "text-lg" : "text-[15px]",
              )}
            >
              {ticket.customer_name}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <div>
              <dt className="text-[11px] text-muted-foreground">Type</dt>
              <dd className="truncate font-medium">
                {ticketTypeLabel(ticket)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Order</dt>
              <dd className="truncate font-mono text-[13px] font-medium">
                {ticket.order_number}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[11px] text-muted-foreground">Ticket code</dt>
              <dd className="font-mono text-[13px] font-medium tracking-tight">
                {ticket.ticket_code}
              </dd>
            </div>
          </dl>
        </div>

        {showQr && (
          <div className="flex shrink-0 items-center border-l border-dashed pl-4">
            <div
              className={cn(
                "flex items-center justify-center rounded-md border bg-white p-1",
                lg ? "size-36" : "size-24",
              )}
            >
              {qr.url ? (
                <img
                  src={qr.url}
                  alt={`QR code for ticket ${ticket.ticket_code}`}
                  className="size-full object-contain"
                />
              ) : qr.error ? (
                <QrCode
                  className="size-8 text-slate-300"
                  aria-label="QR code unavailable"
                />
              ) : (
                <Loader2
                  className="size-5 animate-spin text-slate-300"
                  aria-label="Loading QR code"
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t bg-slate-50/70 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <StatusBadge {...ticketStatusMeta[ticket.status]} />
          {ticket.checked_in_at && (
            <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">
              {formatDateTime(ticket.checked_in_at)}
            </span>
          )}
        </div>
        {onView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onView}
            className="text-blue-600 hover:text-blue-700"
          >
            <Eye className="size-3.5" aria-hidden /> View
          </Button>
        )}
      </div>
    </article>
  );
}
