import { CalendarDays, Info, Loader2, MapPin, TicketCheck } from "lucide-react";
import { formatCurrency, formatDate, toNumber } from "../../../lib/format";
import { Button } from "../../ui/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/Card";
import { Separator } from "../../ui/Separator";

/** Display-only estimate. The authoritative total is calculated by the backend. */
export function estimateOrder(items, ticketTypes) {
  const rows = items
    .map((item) => {
      const type = ticketTypes.find((t) => t.id === item.ticket_type);
      const qty = Number(item.quantity) || 0;
      return type
        ? {
            id: type.id,
            label: type.name,
            qty,
            subtotal: toNumber(type.price) * qty,
          }
        : null;
    })
    .filter((r) => !!r);
  return {
    rows,
    tickets: rows.reduce((s, r) => s + r.qty, 0),
    total: rows.reduce((s, r) => s + r.subtotal, 0),
  };
}

export function OrderSummaryPanel({
  formId,
  event,
  items,
  ticketTypes,
  isSubmitting,
  hasErrors,
}) {
  const { rows, tickets, total } = estimateOrder(items, ticketTypes);

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <CardHeader className="border-b px-5 py-4">
        <CardTitle className="text-[15px]">Order summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 px-5 py-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Event
          </p>
          {event ? (
            <div className="mt-1.5 rounded-lg bg-slate-50 p-3">
              <p className="font-medium text-navy-900">{event.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" aria-hidden />{" "}
                {formatDate(event.start_date, "EEE d MMM yyyy, HH:mm")}
              </p>
              {event.venue && (
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden /> {event.venue}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-1.5 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              No event selected
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Tickets
            </p>
            <span className="text-sm font-medium tabular-nums">{tickets}</span>
          </div>
          <ul className="mt-2 space-y-2 text-sm" aria-live="polite">
            {rows.length === 0 && (
              <li className="text-muted-foreground">
                No ticket types chosen yet.
              </li>
            )}
            {rows.map((row) => (
              <li key={row.id} className="flex justify-between gap-3">
                <span className="text-slate-600">
                  {row.qty} × {row.label}
                </span>
                <span className="tabular-nums">
                  {formatCurrency(row.subtotal)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Estimated total</span>
            <span
              className="text-2xl font-semibold tracking-tight tabular-nums text-navy-900"
              aria-live="polite"
            >
              {formatCurrency(total)}
            </span>
          </div>
          <p className="mt-2 flex gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            The final total is calculated by the server using current ticket
            prices.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3 border-t bg-slate-50/70 px-5 py-4">
        <Button
          type="submit"
          form={formId}
          size="lg"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <TicketCheck className="size-4" aria-hidden />
          )}
          {isSubmitting ? "Creating order…" : "Create order"}
        </Button>
        {hasErrors ? (
          <p
            role="alert"
            className="text-center text-xs font-medium text-red-600"
          >
            Fix the highlighted fields to continue.
          </p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            The order is held as pending until payment is recorded and verified.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
