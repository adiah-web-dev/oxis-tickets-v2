import {
  Banknote,
  CheckCircle2,
  Clock3,
  Hourglass,
  Plus,
  Receipt,
  ScanLine,
  Ticket,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState } from "../components/common/ErrorState";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { CheckInProgressCard } from "../components/dashboard/CheckInProgressCard";
import { RecentOrdersCard } from "../components/dashboard/RecentOrdersCard";
import { SalesChart } from "../components/dashboard/SalesChart";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAuth } from "../contexts/AuthContext";
import { useEventFilter } from "../contexts/EventFilterContext";
import { useDashboard } from "../hooks/useDashboard";
import { useEvents } from "../hooks/useEvents";
import { formatCurrency, formatDate, formatNumber } from "../lib/format";

export function DashboardPage() {
  const { can } = useAuth();
  const { selectedEventId } = useEventFilter();

  const { data: events = [] } = useEvents();
  // const event = events.find((e) => e.id === selectedEventId);

  // const event = (events ?? []).find(
  //   (e) => String(e.id) === String(selectedEventId),
  // );

  const event = events.find((e) => String(e.id) === String(selectedEventId));

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useDashboard(event?.id ?? null);

  const data = dashboardData ?? {
    total_orders: 0,
    pending_orders: 0,
    total_tickets: 0,
    checked_in: 0,
    remaining: 0,
    revenue: 0,
    sales_over_time: [],
    recent_orders: [],
  };

  // // const { data, isLoading, error, refetch } = useDashboard(event.id ?? null);
  // const { data, isLoading, error, refetch } = useDashboard(event?.id ?? null);
  const scopeLabel = event
    ? `${event.name} · ${formatDate(event.start_date)}`
    : "All events";

  const pct = data.total_tickets
    ? Math.round((data.checked_in / data.total_tickets) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        description={
          <>
            Showing figures for{" "}
            <span className="font-mediu text-foreground">{scopeLabel}</span>
          </>
        }
        actions={
          <>
            {can("checkIn") && (
              <Button variant="outline" asChild>
                <Link to="/scanner">
                  <ScanLine className="size-4" aria-hidden /> Scanner
                </Link>
              </Button>
            )}
            {can("createOrders") && (
              <Button asChild>
                <Link
                  to={event ? `/orders/new?event=${event.id}` : "/orders/new"}
                >
                  <Plus className="size-4" aria-hidden /> New order
                </Link>
              </Button>
            )}
          </>
        }
      />

      {error && !data ? (
        <Card>
          <ErrorState
            error={error}
            onRetry={() => refetch()}
            title="Overview could not be loaded"
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <section
            aria-label="Key figures"
            className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6"
          >
            <StatCard
              label="Total orders"
              value={formatNumber(data?.total_orders)}
              icon={Receipt}
              tone="navy"
              isLoading={isLoading}
              hint="Excludes cancelled"
            />
            <StatCard
              label="Awaiting payment"
              value={formatNumber(data?.pending_orders)}
              icon={Hourglass}
              tone="amber"
              isLoading={isLoading}
              hint={
                <Link
                  to="/orders?status=pending"
                  className="text-blue-600 hover:underline"
                >
                  Review pending
                </Link>
              }
            />
            <StatCard
              label="Tickets issued"
              value={formatNumber(data?.total_tickets)}
              icon={Ticket}
              tone="blue"
              isLoading={isLoading}
            />
            <StatCard
              label="Checked in"
              value={formatNumber(data?.checked_in)}
              icon={CheckCircle2}
              tone="green"
              isLoading={isLoading}
              hint={`${pct}% of tickets`}
            />
            <StatCard
              label="Remaining"
              value={formatNumber(data?.remaining)}
              icon={Clock3}
              tone="slate"
              isLoading={isLoading}
              hint="Not yet checked in"
            />
            <StatCard
              label="Revenue (confirmed)"
              value={formatCurrency(data?.revenue)}
              icon={Banknote}
              tone="slate"
              isLoading={isLoading}
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SalesChart data={data?.sales_over_time} isLoading={isLoading} />
            </div>
            <CheckInProgressCard
              checkedIn={data?.checked_in ?? 0}
              total={data?.total_tickets ?? 0}
              isLoading={isLoading}
              scopeLabel={scopeLabel}
            />
          </div>

          <RecentOrdersCard
            orders={data?.recent_orders}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
