import { Plus, Receipt } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useOrders } from "../../hooks/useOrders";
import { EmptyState } from "../common/EmptyState";
import { SearchInput } from "../common/SearchInput";
import { TablePagination } from "../common/TablePagination";
import { OrdersTable } from "../orders/OrdersTable";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function EventOrdersTab({ event }) {
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebouncedValue(search);
  const { data, isLoading, isFetching, error, refetch } = useOrders({
    event: event.id,
    search: debounced,
    page,
  });

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search order number or customer"
          className="sm:w-80"
          label="Search orders"
        />
        {can("createOrders") && event.status === "published" && (
          <Button asChild size="sm">
            <Link to={`/orders/new?event=${event.id}`}>
              <Plus className="size-4" aria-hidden /> New order
            </Link>
          </Button>
        )}
      </div>
      <OrdersTable
        rows={data?.results}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={() => refetch()}
        hideEvent
        emptyState={
          <EmptyState
            icon={Receipt}
            title="No orders for this event"
            description={
              search
                ? "Try a different search."
                : "Orders for this event will appear here."
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
  );
}
