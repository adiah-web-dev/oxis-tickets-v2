import { Bell, CheckCircle2, MailWarning } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useDeliveries } from "../../hooks/useDeliveries";
import { formatRelative } from "../../lib/format";
import { Button } from "../ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";

/** Failed ticket email deliveries — visible to roles that can see deliveries. */
export function NotificationsMenu() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const enabled = can("viewDeliveries");
  const { data, isLoading } = useDeliveries({ status: "failed" }, { enabled });
  const count = data?.count ?? 0;

  if (!enabled) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label={`Notifications${count ? `, ${count} failed deliveries` : ""}`}
        >
          <Bell className="size-[18px]" />
          {count > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {count > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {count} failed
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        )}
        {data && count === 0 && (
          <div className="flex flex-col items-center gap-2 px-2 py-6 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="size-5 text-emerald-600" />
            All ticket emails delivered.
          </div>
        )}
        {data?.results.slice(0, 5).map((d) => (
          <DropdownMenuItem
            key={d.id}
            onSelect={() => navigate("/emails?status=failed")}
            className="items-start gap-2.5 py-2"
          >
            <MailWarning className="mt-0.5 size-4 shrink-0 text-red-500" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                Delivery failed · {d.order_number}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {d.recipient_email} · {formatRelative(d.updated_at)}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
        {count > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => navigate("/emails?status=failed")}
              className="justify-center text-sm font-medium text-blue-600"
            >
              Review failed deliveries
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
