import {
  ArrowLeft,
  Ban,
  CalendarDays,
  FileQuestion,
  Mail,
  Phone,
  Ticket as TicketIcon,
  User,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { StatusBadge } from "../components/common/StatusBadge";
import { DeliveryList } from "../components/orders/DeliveryList";
import { OrderPaymentsCard } from "../components/orders/OrderPaymentsCard";
import { OrderProgress } from "../components/orders/OrderProgress";
import { TicketCard } from "../components/tickets/TicketCard";
import { TicketDetailDialog } from "../components/tickets/TicketDetailDialog";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import { useAuth } from "../contexts/AuthContext";
import { useCancelOrder, useOrder } from "../hooks/useOrders";
import { useOrderPayments } from "../hooks/usePayments";
import { useTickets } from "../hooks/useTickets";
import { getHttpStatus } from "../lib/errors";
import { formatCurrency, formatDateTime } from "../lib/format";
import { orderStatusMeta } from "../lib/status";

export function OrderDetailPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const id = orderId ?? null;
  const { can } = useAuth();
  const { data: order, isLoading, error, refetch } = useOrder(id);
  const payments = useOrderPayments(id, { enabled: can("viewPayments") });
  const tickets = useTickets(
    { order: id ?? undefined },
    { enabled: !!id && order?.status === "confirmed" },
  );
  const cancel = useCancelOrder();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [viewing, setViewing] = useState(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        {getHttpStatus(error) === 404 || !id ? (
          <EmptyState
            icon={FileQuestion}
            title="Order not found"
            description="Check the order number and try again."
            action={
              <Button variant="outline" asChild>
                <Link to="/orders">Back to orders</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState
            error={error}
            onRetry={() => refetch()}
            title="Order could not be loaded"
          />
        )}
      </Card>
    );
  }

  const orderTickets =
    tickets.data?.results.filter(
      (t) => t.order_number === order.order_number,
    ) ?? [];
  const hasPayment = (payments.data ?? []).some(
    (p) => p.status === "pending" || p.status === "verified",
  );
  const confirmed = order.status === "confirmed";
  const steps = [
    { label: "Order created", done: true },
    { label: "Payment recorded", done: confirmed || hasPayment },
    { label: "Payment verified", done: confirmed },
    { label: "Tickets issued", done: confirmed && orderTickets.length > 0 },
  ];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-2 text-muted-foreground"
      >
        <Link to="/orders">
          <ArrowLeft className="size-4" aria-hidden /> All orders
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-mono text-xl font-semibold tracking-tight text-navy-900">
              {order.order_number}
            </h2>
            <StatusBadge {...orderStatusMeta[order.status]} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden />
              {order.event_name}
            </span>
            <span>Created {formatDateTime(order.created_at)}</span>
          </p>
        </div>
        {can("cancelOrders") && order.status !== "cancelled" && (
          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setConfirmCancel(true)}
          >
            <Ban className="size-4" aria-hidden /> Cancel order
          </Button>
        )}
      </div>

      {order.status !== "cancelled" && <OrderProgress steps={steps} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="gap-0 overflow-hidden p-0">
            <CardHeader className="border-b px-5 py-4">
              <CardTitle className="text-[15px]">Order items</CardTitle>
              <CardDescription>
                Prices are calculated and stored by the server at the time of
                ordering.
              </CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="text-xs uppercase tracking-wide text-slate-500">
                    Ticket type
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wide text-slate-500">
                    Qty
                  </TableHead>
                  <TableHead className="hidden text-right text-xs uppercase tracking-wide text-slate-500 sm:table-cell">
                    Unit price
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wide text-slate-500">
                    Line total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, i) => (
                  <TableRow key={item.id ?? i}>
                    <TableCell className="py-3 font-medium">
                      {item.ticket_type_name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {formatCurrency(item.unit_price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.line_total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={2}
                    className="py-3 text-base font-semibold sm:hidden"
                  >
                    Total
                  </TableCell>
                  <TableCell
                    colSpan={3}
                    className="hidden py-3 text-base font-semibold sm:table-cell"
                  >
                    Total
                  </TableCell>
                  <TableCell className="text-right text-base font-semibold tabular-nums">
                    {formatCurrency(order.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <section aria-labelledby="tickets-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="tickets-heading" className="text-[15px] font-semibold">
                Tickets
              </h3>
              {confirmed && orderTickets.length > 0 && (
                <span className="text-sm text-muted-foreground tabular-nums">
                  {orderTickets.filter((t) => t.status === "used").length} of{" "}
                  {orderTickets.length} checked in
                </span>
              )}
            </div>
            {!confirmed ? (
              <Card>
                <EmptyState
                  icon={TicketIcon}
                  title={
                    order.status === "cancelled"
                      ? "Order cancelled"
                      : "Tickets not issued yet"
                  }
                  description={
                    order.status === "cancelled"
                      ? "No tickets are valid for this order."
                      : "Tickets are generated and emailed automatically once payments are verified in full."
                  }
                />
              </Card>
            ) : tickets.isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-52 rounded-xl" />
                ))}
              </div>
            ) : tickets.error ? (
              <Card>
                <ErrorState
                  error={tickets.error}
                  onRetry={() => tickets.refetch()}
                />
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {orderTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onView={() => setViewing(ticket.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-[15px]">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center gap-2.5">
                <User className="size-4 text-slate-400" aria-hidden />
                <span className="font-medium">{order.customer_name}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="size-4 text-slate-400" aria-hidden />
                <a
                  href={`mailto:${order.customer_email}`}
                  className="truncate text-blue-600 hover:underline"
                >
                  {order.customer_email}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="size-4 text-slate-400" aria-hidden />
                <a
                  href={`tel:${order.customer_phone}`}
                  className="tabular-nums hover:underline"
                >
                  {order.customer_phone}
                </a>
              </p>
            </CardContent>
          </Card>

          {can("viewPayments") && (
            <OrderPaymentsCard
              order={order}
              openRecordOnLoad={searchParams.get("pay") === "1"}
            />
          )}

          {can("viewDeliveries") && (
            <Card className="gap-4">
              <CardHeader>
                <CardTitle className="text-[15px]">Email delivery</CardTitle>
                <CardDescription>
                  Ticket emails sent by the server
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DeliveryList orderId={order.id} />
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={`Cancel order ${order.order_number}?`}
        description={
          confirmed
            ? "This order is confirmed. Cancelling it will invalidate its tickets. This cannot be undone."
            : "The order will be cancelled and its reserved tickets released. This cannot be undone."
        }
        confirmLabel="Cancel order"
        destructive
        isPending={cancel.isPending}
        onConfirm={() =>
          cancel.mutate(order.id, { onSettled: () => setConfirmCancel(false) })
        }
      />
      <TicketDetailDialog
        ticketId={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      />
    </div>
  );
}
