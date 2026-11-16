import { useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useTickets } from "../../hooks/useTickets";
import { ticketStatusMeta } from "../../lib/status";
import { SearchInput } from "../common/SearchInput";
import { TablePagination } from "../common/TablePagination";
import { TicketDetailDialog } from "../tickets/TicketDetailDialog";
import { TicketsTable } from "../tickets/TicketsTable";
import { Card } from "../ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";

export function EventTicketsTab({ eventId }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const debounced = useDebouncedValue(search);
  const { data, isLoading, isFetching, error, refetch } = useTickets({
    event: eventId,
    search: debounced,
    status: status === "all" ? undefined : status,
    page,
  });

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Ticket code, order or customer"
          className="sm:w-80"
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
        hideEvent
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
      <TicketDetailDialog
        ticketId={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      />
    </Card>
  );
}
