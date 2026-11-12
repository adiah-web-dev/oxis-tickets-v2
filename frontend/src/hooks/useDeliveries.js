import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "../lib/errors";
import { queryKeys } from "../lib/queryKeys";
import { listDeliveries, retryDelivery } from "../services/deliveryService";

export function useDeliveries(params, options = {}) {
  return useQuery({
    queryKey: queryKeys.deliveries.list(params),
    queryFn: () => listDeliveries(params),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useRetryDelivery() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (delivery) => retryDelivery(delivery.id),
    onSuccess: (_data, delivery) => {
      client.invalidateQueries({ queryKey: queryKeys.deliveries.all });
      toast.success("Delivery retried", {
        description: `Ticket email re-queued for ${delivery.recipient_email}`,
      });
    },
    onError: (error) =>
      toast.error("Retry failed", { description: getApiErrorMessage(error) }),
  });
}
