import { CalendarPlus, CalendarX2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { PageHeader } from "../components/common/PageHeader";
import { SearchInput } from "../components/common/SearchInput";
import { EventCard } from "../components/events/EventCard";
import { EventFormDialog } from "../components/events/EventFormDialog";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/Tabs";
import { useAuth } from "../contexts/AuthContext";
import { useEvents } from "../hooks/useEvents";
import { isPastDate } from "../lib/format";

export function EventsPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const { data: events, isLoading, error, refetch } = useEvents();
  const [search, setSearch] = useState("");
  const [timeframe, setTimeframe] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (events ?? [])
      .filter((e) =>
        timeframe === "all"
          ? true
          : timeframe === "past"
            ? isPastDate(e.end_date)
            : !isPastDate(e.end_date),
      )
      .filter(
        (e) =>
          !q ||
          e.name.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        const ap = isPastDate(a.end_date);
        const bp = isPastDate(b.end_date);
        if (ap !== bp) return ap ? 1 : -1;
        return ap
          ? b.start_date.localeCompare(a.start_date)
          : a.start_date.localeCompare(b.start_date);
      });
  }, [events, search, timeframe]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        description="School events, their ticket types and sales windows."
        actions={
          can("manageEvents") && (
            <Button onClick={openCreate}>
              <CalendarPlus className="size-4" aria-hidden /> Create event
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search events or venues"
          className="sm:w-72"
          label="Search events"
        />
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && !events ? (
        <Card>
          <ErrorState
            error={error}
            onRetry={() => refetch()}
            title="Events could not be loaded"
          />
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[260px] rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarX2}
            title={
              events?.length ? "No events match your filters" : "No events yet"
            }
            description={
              events?.length
                ? "Try another search term or timeframe."
                : "Create your first event to start issuing tickets."
            }
            action={
              !events?.length &&
              can("manageEvents") && (
                <Button onClick={openCreate}>Create event</Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={(e) => {
                setEditing(e);
                setFormOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editing}
        onSaved={(saved) => {
          if (!editing) navigate(`/events/${saved.id}`);
        }}
      />
    </div>
  );
}
