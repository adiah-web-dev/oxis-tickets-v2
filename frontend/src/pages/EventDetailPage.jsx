import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Receipt,
  Ticket,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { SalesChart } from "../components/dashboard/SalesChart";
import { EventFormDialog } from "../components/events/EventFormDialog";
import { EventOrdersTab } from "../components/events/EventOrdersTab";
import { EventTicketsTab } from "../components/events/EventTicketsTab";
import { TicketTypesTab } from "../components/events/TicketTypesTab";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Progress } from "../components/ui/Progress";
import { Skeleton } from "../components/ui/Skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/Tabs";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../hooks/useDashboard";
import { useDeleteEvent, useEvent } from "../hooks/useEvents";
import { getHttpStatus } from "../lib/errors";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from "../lib/format";
import { eventStatusMeta } from "../lib/status";

export function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const id = eventId ?? null;
  const { can } = useAuth();
  const canSeeSales = can("viewOrders");
  const { data: event, isLoading, error, refetch } = useEvent(id);
  const stats = useDashboard(id, { enabled: canSeeSales });
  const remove = useDeleteEvent();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }
  if (!event) {
    return (
      <Card>
        {getHttpStatus(error) === 404 || !id ? (
          <EmptyState
            icon={CalendarX2}
            title="Event not found"
            description="It may have been removed or the link is incorrect."
            action={
              <Button variant="outline" asChild>
                <Link to="/events">Back to events</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState
            error={error}
            onRetry={() => refetch()}
            title="Event could not be loaded"
          />
        )}
      </Card>
    );
  }

  const pct = stats.data?.total_tickets
    ? Math.round((stats.data.checked_in / stats.data.total_tickets) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-2 text-muted-foreground"
      >
        <Link to="/events">
          <ArrowLeft className="size-4" aria-hidden /> All events
        </Link>
      </Button>

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div
            className="relative flex size-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl bg-navy-900 bg-cover bg-center text-white"
            style={
              event.banner_image
                ? { backgroundImage: `url(${event.banner_image})` }
                : undefined
            }
          >
            {event.banner_image && (
              <div className="absolute inset-0 bg-black/50" aria-hidden />
            )}
            <span className="relative text-[11px] font-semibold uppercase tracking-wide text-blue-300">
              {formatDate(event.start_date, "MMM")}
            </span>
            <span className="relative text-2xl font-semibold leading-none">
              {formatDate(event.start_date, "d")}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-navy-900">
                {event.name}
              </h2>
              <StatusBadge {...eventStatusMeta[event.status]} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-4 text-slate-400" aria-hidden />
                {formatDate(event.start_date, "EEE d MMM yyyy, HH:mm")} –{" "}
                {formatDate(event.end_date, "HH:mm")}
              </span>
              {event.venue && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-slate-400" aria-hidden />
                  {event.venue}
                </span>
              )}
              {(event.sales_start || event.sales_end) && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-slate-400" aria-hidden />
                  Sales{" "}
                  {event.sales_start
                    ? formatDate(event.sales_start)
                    : "now"} →{" "}
                  {event.sales_end ? formatDate(event.sales_end) : "event"}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {can("manageEvents") && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Delete event"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" />
                </Button>
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" aria-hidden /> Edit
                </Button>
              </>
            )}
            {can("createOrders") && event.status === "published" && (
              <Button asChild>
                <Link to={`/orders/new?event=${event.id}`}>
                  <Plus className="size-4" aria-hidden /> New order
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="gap-4">
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto border-b"
        >
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {canSeeSales && <TabsTrigger value="orders">Orders</TabsTrigger>}
          {can("viewTickets") && (
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
          )}
          <TabsTrigger value="types">Ticket Types</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {canSeeSales &&
            (stats.error && !stats.data ? (
              <Card>
                <ErrorState
                  error={stats.error}
                  onRetry={() => stats.refetch()}
                />
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  <StatCard
                    label="Orders"
                    value={formatNumber(stats.data?.total_orders)}
                    icon={Receipt}
                    tone="navy"
                    isLoading={stats.isLoading}
                    hint={`${formatNumber(stats.data?.pending_orders)} awaiting payment`}
                  />
                  <StatCard
                    label="Tickets issued"
                    value={formatNumber(stats.data?.total_tickets)}
                    icon={Ticket}
                    tone="blue"
                    isLoading={stats.isLoading}
                  />
                  <StatCard
                    label="Checked in"
                    value={formatNumber(stats.data?.checked_in)}
                    icon={CheckCircle2}
                    tone="green"
                    isLoading={stats.isLoading}
                    hint={`${pct}% of tickets`}
                  />
                  <StatCard
                    label="Revenue (confirmed)"
                    value={formatCurrency(stats.data?.revenue)}
                    icon={Banknote}
                    isLoading={stats.isLoading}
                  />
                </div>
                <div className="lg:col-span-2">
                  <SalesChart
                    data={stats.data?.sales_over_time}
                    isLoading={stats.isLoading}
                  />
                </div>
              </>
            ))}
          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-[15px]">About this event</CardTitle>
              <CardDescription>
                Created by {event.created_by_email ?? "unknown"} · updated{" "}
                {formatDateTime(event.updated_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canSeeSales && (
                <div>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-muted-foreground">Arrived</span>
                    <span className="font-medium tabular-nums">{pct}%</span>
                  </div>
                  <Progress
                    value={pct}
                    className="h-2 [&>div]:bg-emerald-500"
                    aria-label="Check-in progress"
                  />
                </div>
              )}
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {event.description || "No description provided."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {canSeeSales && (
          <TabsContent value="orders">
            <EventOrdersTab event={event} />
          </TabsContent>
        )}
        {can("viewTickets") && (
          <TabsContent value="tickets">
            <EventTicketsTab eventId={event.id} />
          </TabsContent>
        )}
        <TabsContent value="types">
          <TicketTypesTab eventId={event.id} />
        </TabsContent>
      </Tabs>

      <EventFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        event={event}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${event.name}”?`}
        description="The event and its ticket types will be removed. Events that already have orders may be protected by the server — consider cancelling instead."
        confirmLabel="Delete event"
        destructive
        isPending={remove.isPending}
        onConfirm={() =>
          remove.mutate(event.id, {
            onSuccess: () => navigate("/events", { replace: true }),
            onSettled: () => setConfirmDelete(false),
          })
        }
      />
    </div>
  );
}
