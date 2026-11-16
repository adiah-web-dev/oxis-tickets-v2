import { Plus, Receipt, X } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { SearchInput } from "../components/common/SearchInput";
import { TablePagination } from "../components/common/TablePagination";
import { OrdersTable } from "../components/orders/OrdersTable";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";
import { useAuth } from "../contexts/AuthContext";
import { useEventFilter } from "../contexts/EventFilterContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useEvents } from "../hooks/useEvents";
import { useOrders } from "../hooks/useOrders";
import { orderStatusMeta } from "../lib/status";

export function OrdersPage() {
  const [params] = useSearchParams();
  const { can } = useAuth();
  const { selectedEventId, setSelectedEventId } = useEventFilter();
  const { data: events } = useEvents();
  const event = events?.find((e) => e.id === selectedEventId);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "all");
  const [page, setPage] = useState(1);
  const debounced = useDebouncedValue(search);

  const { data, isLoading, isFetching, error, refetch } = useOrders({
    search: debounced,
    status: status === "all" ? undefined : status,
    event: event?.id,
    page,
  });

  const hasFilters = !!search || status !== "all" || !!event;
  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setSelectedEventId(null);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        description="Find orders by number, customer name, email or phone."
        actions={
          can("createOrders") && (
            <Button asChild>
              <Link to="/orders/new">
                <Plus className="size-4" aria-hidden /> New order
              </Link>
            </Button>
          )
        }
      />

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search order number or customer"
            className="lg:w-96"
            label="Search orders"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-9 w-48 bg-white"
                aria-label="Filter by order status"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.keys(orderStatusMeta).map((s) => (
                  <SelectItem key={s} value={s}>
                    {orderStatusMeta[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {event && (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-blue-50 px-3 text-sm text-blue-700">
                {event.name}
                <button
                  type="button"
                  onClick={() => setSelectedEventId(null)}
                  aria-label="Clear event filter"
                  className="rounded hover:bg-blue-100"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            )}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <OrdersTable
          rows={data?.results}
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          onRetry={() => refetch()}
          emptyState={
            <EmptyState
              icon={Receipt}
              title={
                hasFilters ? "No orders match these filters" : "No orders yet"
              }
              description={
                hasFilters
                  ? "Try a different search or clear the filters."
                  : "Create the first order to start selling tickets."
              }
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : can("createOrders") ? (
                  <Button asChild>
                    <Link to="/orders/new">Create order</Link>
                  </Button>
                ) : undefined
              }
            />
          }
        />
        {data && data.count > 0 && (
          <TablePagination
            page={page}
            count={data.count}
            hasNext={!!data.next}
            hasPrevious={!!data.previous}
            onPageChange={setPage}
            itemLabel="orders"
          />
        )}
      </Card>
    </div>
  );
}
