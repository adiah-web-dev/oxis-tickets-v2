import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Skeleton } from "../ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/Table";
import { ErrorState } from "./ErrorState";

export function DataTable({
  columns,
  rows,
  getRowId,
  isLoading,
  isFetching,
  error,
  onRetry,
  onRowClick,
  rowLabel,
  ordering,
  onOrderingChange,
  emptyState,
  skeletonRows = 8,
}) {
  if (error && !rows) return <ErrorState error={error} onRetry={onRetry} />;

  const toggleSort = (field) => {
    if (!onOrderingChange) return;
    onOrderingChange(ordering === field ? `-${field}` : field);
  };

  return (
    <div
      className={cn(
        "relative transition-opacity",
        isFetching && !isLoading && "opacity-70",
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            {columns.map((col) => {
              const active = ordering?.replace(/^-/, "") === col.sortField;
              const desc = ordering?.startsWith("-");
              return (
                <TableHead
                  key={col.key}
                  className={cn(
                    "h-10 text-xs font-medium uppercase tracking-wide text-slate-500",
                    col.headerClassName,
                  )}
                  aria-sort={
                    active ? (desc ? "descending" : "ascending") : undefined
                  }
                >
                  {col.sortField && onOrderingChange ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.sortField)}
                      className="-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 uppercase hover:text-foreground"
                    >
                      {col.header}
                      {active ? (
                        desc ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ArrowUp className="size-3" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={`s-${i}`} className="hover:bg-transparent">
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    <Skeleton className="h-4 w-full max-w-[140px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          {!isLoading &&
            rows?.map((row) => (
              <TableRow
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={rowLabel?.(row)}
                className={cn(
                  onRowClick &&
                    "cursor-pointer focus-visible:bg-blue-50/60 focus-visible:outline-none",
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn("py-3", col.className)}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {!isLoading && rows && rows.length === 0 && emptyState}
    </div>
  );
}
