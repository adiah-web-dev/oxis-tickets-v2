import { CalendarDays } from "lucide-react";
import { useEventFilter } from "../../contexts/EventFilterContext";
import { useEvents } from "../../hooks/useEvents";
import { cn } from "../../lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";

export function EventSelector({ className }) {
  const { data: events, isLoading } = useEvents();
  const { selectedEventId, setSelectedEventId } = useEventFilter();
  const known =
    !selectedEventId || events?.some((e) => e.id === selectedEventId);

  return (
    <Select
      value={selectedEventId && known ? selectedEventId : "all"}
      onValueChange={(v) => setSelectedEventId(v === "all" ? null : v)}
      disabled={isLoading}
    >
      <SelectTrigger
        className={cn("h-9 w-full bg-white sm:w-[220px]", className)}
        aria-label="Filter by event"
      >
        <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
        <SelectValue
          placeholder={isLoading ? "Loading events…" : "All events"}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All events</SelectItem>
        {events?.map((event) => (
          <SelectItem key={event.id} value={event.id}>
            {event.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
