// Contextual line under the top bar's page title, with page-level actions

import { cn } from "../../lib/utils";

export function PageHeader({ description, actions, className }) {
  <div
    className={cn(
      "mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
      className,
    )}
  >
    {description ? (
      <p className="text-sm text-muted-foreground">{description}</p>
    ) : (
      <span />
    )}
    {actions && (
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    )}
  </div>;
}
