import { motion } from "framer-motion";
import { Check, Clock, Copy, Plus, Receipt, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { formatCurrency, formatDateTime } from "../../../lib/format";
import { orderStatusMeta } from "../../../lib/status";
import { StatusBadge } from "../../common/StatusBadge";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";

export function OrderConfirmation({ order, onCreateAnother }) {
  const { can } = useAuth();
  const tickets = order.items.reduce((s, i) => s + i.quantity, 0);

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(order.order_number);
      toast.success("Order number copied");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-xl"
    >
      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <motion.span
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 18 }}
            className="flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white"
          >
            <Check className="size-7" strokeWidth={2.5} aria-hidden />
          </motion.span>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-navy-900">
            Order created
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tickets} ticket{tickets === 1 ? "" : "s"} reserved for{" "}
            {order.customer_name} · {order.event_name}
          </p>
          <button
            type="button"
            onClick={copyReference}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border bg-slate-50 px-4 py-2.5 transition-colors hover:bg-slate-100"
            aria-label={`Copy order number ${order.order_number}`}
          >
            <span className="text-xs text-muted-foreground">Order</span>
            <span className="font-mono text-lg font-semibold tracking-tight text-navy-900">
              {order.order_number}
            </span>
            <Copy className="size-3.5 text-muted-foreground" aria-hidden />
          </button>
        </div>

        <dl className="grid grid-cols-2 border-y text-sm">
          <div className="border-r px-6 py-4">
            <dt className="text-xs text-muted-foreground">
              Total (server calculated)
            </dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums">
              {formatCurrency(order.total)}
            </dd>
          </div>
          <div className="px-6 py-4">
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="mt-1">
              <StatusBadge {...orderStatusMeta[order.status]} />
            </dd>
          </div>
        </dl>

        <div className="space-y-3 px-6 py-4">
          {order.expires_at && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
              Payment must be recorded and verified before{" "}
              {formatDateTime(order.expires_at)} or the order expires.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Next: record the payment. Once an event manager verifies it in full,
            tickets are generated and emailed to{" "}
            <strong className="text-foreground">{order.customer_email}</strong>{" "}
            automatically.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCreateAnother}>
            <Plus className="size-4" aria-hidden /> New order
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/orders/${order.id}`}>
              <Receipt className="size-4" aria-hidden /> View order
            </Link>
          </Button>
          {can("recordPayments") && (
            <Button asChild>
              <Link to={`/orders/${order.id}?pay=1`}>
                <Wallet className="size-4" aria-hidden /> Record payment
              </Link>
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
