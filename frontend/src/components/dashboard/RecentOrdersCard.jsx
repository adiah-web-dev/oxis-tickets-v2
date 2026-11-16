import { ArrowRight, Receipt } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatCurrency, formatRelative } from "../../lib/format";
import { orderStatusMeta } from "../../lib/status";
import { EmptyState } from "../common/EmptyState";
import { StatusBadge } from "../common/StatusBadge";
import { ticketCount } from "../orders/OrdersTable";
import { Avatar, AvatarFallback } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";

export function RecentOrdersCard({ orders, isLoading }) {
  const navigate = useNavigate();

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
        <div>
          <CardTitle className="text-[15px]">Recent orders</CardTitle>
          <CardDescription>Latest orders in the selected scope</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-blue-600 hover:text-blue-700"
        >
          <Link to="/orders">
            View all <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </Button>
      </CardHeader>
      <ul className="divide-y border-t">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-6 py-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </li>
          ))}
        {!isLoading && orders.length === 0 && (
          <li>
            <EmptyState
              icon={Receipt}
              title="No orders yet"
              description="New orders will show up here."
            />
          </li>
        )}
        {orders.map((order) => (
          <li key={order.id}>
            <button
              type="button"
              onClick={() => navigate(`/orders/${order.id}`)}
              className="flex w-full items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:bg-blue-50/60 focus-visible:outline-none"
            >
              <Avatar size="sm">
                <AvatarFallback className="bg-slate-100 text-[11px] font-medium text-slate-700">
                  {initials(order.customer_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {order.customer_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {order.order_number} · {ticketCount(order)} ticket
                  {ticketCount(order) === 1 ? "" : "s"} ·{" "}
                  {formatRelative(order.created_at)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(order.total)}
                </span>
                <StatusBadge
                  {...orderStatusMeta[order.status]}
                  className="hidden sm:inline-flex"
                />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
