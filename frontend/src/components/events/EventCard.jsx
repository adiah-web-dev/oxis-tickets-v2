import {
  ArrowRight,
  Clock,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Tags,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { formatDate, formatNumber, isPastDate } from "../../lib/format";
import { eventStatusMeta } from "../../lib/status";
import { StatusBadge } from "../common/StatusBadge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";

function salesLabel(event) {
  if (event.status !== "published") return "Not on sale";
  if (event.sales_start && !isPastDate(event.sales_start))
    return `Sales open ${formatDate(event.sales_start)}`;
  if (event.sales_end && isPastDate(event.sales_end)) return "Sales closed";
  return event.sales_end
    ? `On sale until ${formatDate(event.sales_end)}`
    : "On sale";
}

export function EventCard({ event, onEdit }) {
  const navigate = useNavigate();
  const { can } = useAuth();
  const sold = event.ticket_types.reduce(
    (s, t) => s + (t.quantity_sold ?? 0),
    0,
  );
  const capacity = event.ticket_types.reduce(
    (s, t) => s + (t.quantity ?? 0),
    0,
  );

  return (
    <Card className="group relative gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md">
      <div
        className="relative h-24 bg-navy-900 bg-cover bg-center"
        style={
          event.banner_image
            ? { backgroundImage: `url(${event.banner_image})` }
            : undefined
        }
      >
        {event.banner_image && (
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: Number(event.ticket_overlay_opacity) || 0.4 }}
            aria-hidden
          />
        )}
        <div className="absolute left-4 top-3">
          <StatusBadge
            {...eventStatusMeta[event.status]}
            className="bg-white"
          />
        </div>
        <div className="absolute bottom-0 left-4 translate-y-1/2 flex w-14 flex-col items-center rounded-lg border bg-white py-1.5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">
            {formatDate(event.start_date, "MMM")}
          </span>
          <span className="text-xl font-semibold leading-tight text-navy-900">
            {formatDate(event.start_date, "d")}
          </span>
        </div>
      </div>

      <div className="px-5 pb-4 pt-9">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate(`/events/${event.id}`)}
            className="min-w-0 text-left after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            <h3 className="truncate text-[15px] font-semibold text-foreground">
              {event.name}
            </h3>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="relative z-10 -mr-1.5 -mt-1"
                aria-label={`Actions for ${event.name}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => navigate(`/events/${event.id}`)}
              >
                <ArrowRight className="size-4" /> View details
              </DropdownMenuItem>
              {can("manageEvents") && (
                <DropdownMenuItem onSelect={() => onEdit(event)}>
                  <Pencil className="size-4" /> Edit event
                </DropdownMenuItem>
              )}
              {can("createOrders") && event.status === "published" && (
                <DropdownMenuItem
                  onSelect={() => navigate(`/orders/new?event=${event.id}`)}
                >
                  <Plus className="size-4" /> New order
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{formatDate(event.start_date, "EEE d MMM yyyy, HH:mm")}</span>
          {event.venue && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" aria-hidden />
              {event.venue}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x border-t text-sm">
        <div className="flex items-center gap-2 px-5 py-3">
          <Tags className="size-4 text-slate-400" aria-hidden />
          <span>
            <span className="font-semibold tabular-nums">
              {event.ticket_types.length}
            </span>{" "}
            <span className="text-muted-foreground">ticket types</span>
          </span>
        </div>
        <div className="px-5 py-3">
          <span className="font-semibold tabular-nums">
            {formatNumber(sold)}
          </span>
          <span className="text-muted-foreground">
            {capacity ? ` / ${formatNumber(capacity)} sold` : " sold"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t bg-slate-50/70 px-5 py-2.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" aria-hidden /> {salesLabel(event)}
      </div>
    </Card>
  );
}
