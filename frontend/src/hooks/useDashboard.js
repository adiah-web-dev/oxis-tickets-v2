import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { getDashboard } from "../services/dashboardService";

export function useDashboard(eventId, options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard(eventId),
    queryFn: () => getDashboard(eventId),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}
