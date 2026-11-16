import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "../../lib/format";
import { Button } from "../ui/Button";

export function TablePagination({
  page,
  count,
  hasNext,
  hasPrevious,
  onPageChange,
  itemLabel = "results",
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
      <p className="text-xs text-muted-foreground tabular-nums">
        {formatNumber(count)} {itemLabel}
      </p>
      <div className="flex items-center gap-1.5">
        <span className="mr-2 text-xs text-muted-foreground tabular-nums">
          Page {page}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevious}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
