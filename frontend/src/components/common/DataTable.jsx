export function DataTable({
  columns,
  rows,
  getRowId,
  isLoading,
  error,
  onRetry,
  onRowclick,
  rowLabel,
  ordering,
  onOrderingChange,
  emptyState,
  skeletonRows = 8,
}) {
  if (error && !rows) return <ErrorState error={error} onRetry={onRetry} />;
}
