import { AlertTriangle, Lock, RotateCw } from "lucide-react";
import { getApiErrorMessage, getHttpStatus } from "../../lib/errors";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";

export function ErrorState({
  error,
  title = "Unable to load data",
  onRetry,
  className,
}) {
  const forbidden = getHttpStatus(error) === 403;
  const Icon = forbidden ? Lock : AlertTriangle;

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full",
          forbidden ? "bg-slate-100 text-slate-600" : "bg-red-50 text-red-600",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-4 text-sm font-semibold">
        {forbidden ? "Access restricted" : title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {getApiErrorMessage(error)}
      </p>
      {onRetry && !forbidden && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCw className="size-3.5" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}
