import { useState } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { SearchInput } from "../components/common/SearchInput";
import { TablePagination } from "../components/common/TablePagination";
import { TicketDetailDialog } from "../components/tickets/TicketDetailDialog";
import { TicketsTable } from "../components/tickets/TicketsTable";
import { Card } from "../components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";
import { useEventFilter } from "../contexts/EventFilterContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useEvents } from "../hooks/useEvents";
import { useTickets } from "../hooks/useTickets";
import { ticketStatusMeta } from "../lib/status";

export function TicketsPage() {
  const { selectedEventId } = useEventFilter();
  const { data: events } = useEvents();
  const eventId = events?.some((e) => e.id === selectedEventId)
    ? (selectedEventId ?? undefined)
    : undefined;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const debounced = useDebouncedValue(search);

  const { data, isLoading, isFetching, error, refetch } = useTickets({
    search: debounced,
    event: eventId,
    status: status === "all" ? undefined : status,
    page,
  });

  return (
    <div>
      <PageHeader description="Tickets are issued automatically when an order’s payments are verified in full." />

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Ticket code, order number, name or email"
            className="sm:w-96"
            label="Search tickets"
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="h-9 bg-white sm:w-48"
              aria-label="Filter by ticket status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.keys(ticketStatusMeta).map((s) => (
                <SelectItem key={s} value={s}>
                  {ticketStatusMeta[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TicketsTable
          rows={data?.results}
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          onRetry={() => refetch()}
          onView={(t) => setViewing(t.id)}
        />
        {data && data.count > 0 && (
          <TablePagination
            page={page}
            count={data.count}
            hasNext={!!data.next}
            hasPrevious={!!data.previous}
            onPageChange={setPage}
            itemLabel="tickets"
          />
        )}
      </Card>

      <TicketDetailDialog
        ticketId={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      />
    </div>
  );
}
