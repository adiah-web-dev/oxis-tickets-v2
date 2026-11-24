import {
  Ban,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Receipt,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  openTicketPdf,
  useCancelTicket,
  useTicket,
} from "../../hooks/useTickets";
import { formatDateTime } from "../../lib/format";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { ErrorState } from "../common/ErrorState";
import { Button } from "../ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog";
import { Skeleton } from "../ui/Skeleton";
import { TicketCard } from "./TicketCard";

export function TicketDetailDialog({ ticketId, onOpenChange }) {
  const { data: ticket, isLoading, error, refetch } = useTicket(ticketId);
  const { can } = useAuth();
  const [pdfBusy, setPdfBusy] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const cancelTicket = useCancelTicket();

  const handlePdf = async (mode) => {
    if (!ticket) return;
    setPdfBusy(mode);
    await openTicketPdf(ticket.id, ticket.ticket_code, mode);
    setPdfBusy(null);
  };

  return (
    <Dialog open={ticketId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ticket details</DialogTitle>
          <DialogDescription>
            {ticket
              ? `${ticket.ticket_code} · Order ${ticket.order_number}`
              : "Loading ticket…"}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
        {error && !ticket && (
          <ErrorState
            error={error}
            onRetry={() => refetch()}
            title="Ticket could not be loaded"
          />
        )}

        {ticket && (
          <div className="space-y-4">
            <TicketCard ticket={ticket} size="lg" />
            <dl className="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Customer email
                </dt>
                <dd className="truncate">{ticket.customer_email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Issued</dt>
                <dd>{formatDateTime(ticket.issued_at)}</dd>
              </div>
            </dl>
            {ticket.status === "used" && (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  Checked in {formatDateTime(ticket.checked_in_at)}
                  {ticket.checked_in_by_email && (
                    <> by {ticket.checked_in_by_email}</>
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {ticket && (
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" asChild>
              <Link
                to={`/orders?search=${encodeURIComponent(ticket.order_number)}`}
                onClick={() => onOpenChange(false)}
              >
                <Receipt className="size-4" aria-hidden /> Find order
              </Link>
            </Button>
            {can("verifyPayments") && ticket.status !== "cancelled" && (
              <Button
                variant="destructive"
                onClick={() => setConfirmCancel(true)}
              >
                <Ban className="size-4" aria-hidden /> Cancel ticket
              </Button>
            )}
            {can("downloadTickets") && ticket.status !== "cancelled" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePdf("download")}
                  disabled={!!pdfBusy}
                >
                  {pdfBusy === "download" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  Download PDF
                </Button>
                <Button onClick={() => handlePdf("view")} disabled={!!pdfBusy}>
                  {pdfBusy === "view" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                  View PDF
                </Button>
              </div>
            )}
          </DialogFooter>
        )}
        <ConfirmDialog
          open={confirmCancel}
          onOpenChange={setConfirmCancel}
          title="Cancel this ticket?"
          description="The ticket will remain in the records but its QR code will no longer be accepted at check-in."
          confirmLabel="Cancel ticket"
          destructive
          isPending={cancelTicket.isPending}
          onConfirm={() =>
            cancelTicket.mutate(
              { id: ticket.id, reason: "Ticket invalidated by administrator." },
              { onSettled: () => setConfirmCancel(false) },
            )
          }
        />
      </DialogContent>
    </Dialog>
  );
}
