import { MoreHorizontal, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useDeleteTicketType, useTicketTypes } from "../../hooks/useEvents";
import { formatCurrency, formatNumber } from "../../lib/format";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { EmptyState } from "../common/EmptyState";
import { ErrorState } from "../common/ErrorState";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { Progress } from "../ui/Progress";
import { Skeleton } from "../ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/Table";
import { TicketTypeFormDialog } from "./TicketTypeFormDialog";

const th = "text-xs uppercase tracking-wide text-slate-500";

export function TicketTypesTab({ eventId }) {
  const { can } = useAuth();
  const canManage = can("manageEvents");
  const { data, isLoading, error, refetch } = useTicketTypes(eventId);
  const remove = useDeleteTicketType();
  const [editing, setEditing] = (useState < TicketType) | (null > null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = (useState < TicketType) | (null > null);

  const openForm = (type) => {
    setEditing(type);
    setFormOpen(true);
  };

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b p-4">
        <p className="text-sm text-muted-foreground">
          Ticket types and their server-side prices.
        </p>
        {canManage && (
          <Button size="sm" onClick={() => openForm(null)}>
            <Plus className="size-4" aria-hidden /> Add ticket type
          </Button>
        )}
      </div>

      {error && !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className={th}>Ticket type</TableHead>
              <TableHead className={th}>Price</TableHead>
              <TableHead className={`${th} hidden sm:table-cell`}>
                Sold
              </TableHead>
              <TableHead className={`${th} hidden md:table-cell`}>
                Max / order
              </TableHead>
              {canManage && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: canManage ? 5 : 4 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {data?.map((type) => {
              const sold = type.quantity_sold ?? 0;
              const pct = type.quantity
                ? Math.min(100, Math.round((sold / type.quantity) * 100))
                : 0;
              return (
                <TableRow key={type.id}>
                  <TableCell className="py-3">
                    <p className="font-medium">{type.name}</p>
                    {type.description && (
                      <p className="text-xs text-muted-foreground">
                        {type.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(type.price)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {type.quantity ? (
                      <div className="flex items-center gap-2">
                        <Progress
                          value={pct}
                          className="h-1.5 w-20"
                          aria-label={`${type.name} sold`}
                        />
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {formatNumber(sold)} / {formatNumber(type.quantity)}
                        </span>
                      </div>
                    ) : (
                      <span className="tabular-nums">{formatNumber(sold)}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">
                    {type.max_per_order ?? "—"}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${type.name}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openForm(type)}>
                            <Pencil className="size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleting(type)}
                          >
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {data?.length === 0 && (
        <EmptyState
          icon={Tags}
          title="No ticket types yet"
          description="Add at least one ticket type before publishing this event."
          action={
            canManage && (
              <Button onClick={() => openForm(null)}>Add ticket type</Button>
            )
          }
        />
      )}

      <TicketTypeFormDialog
        eventId={eventId}
        ticketType={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete “${deleting?.name}”?`}
        description="This ticket type will be removed. Types that already have orders may be protected by the server."
        confirmLabel="Delete ticket type"
        destructive
        isPending={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })
        }
      />
    </Card>
  );
}
