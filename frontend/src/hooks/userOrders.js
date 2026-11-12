import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "../lib/errors";
import { queryKeys } from "../lib/queryKeys";
import {
  cancelOrder,
  createOrder,
  getOrder,
  listOrders,
} from "../services/orderService";

export function useOrders(params, options = {}) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => listOrders(params),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? ""),
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
}

/** Everything that changes when an order's lifecycle moves forward. */
export function useInvalidateOrderWorkflow() {
  const client = useQueryClient();
  return (orderId) => {
    if (orderId)
      client.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
    client.invalidateQueries({ queryKey: queryKeys.orders.all });
    client.invalidateQueries({ queryKey: queryKeys.payments.all });
    client.invalidateQueries({ queryKey: queryKeys.tickets.all });
    client.invalidateQueries({ queryKey: queryKeys.deliveries.all });
    client.invalidateQueries({ queryKey: queryKeys.ticketTypes.all });
    client.invalidateQueries({ queryKey: queryKeys.events.all });
    client.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useCreateOrder() {
  const invalidate = useInvalidateOrderWorkflow();
  return useMutation({
    mutationFn: (payload) => createOrder(payload),
    onSuccess: (order) => {
      invalidate(order.id);
      toast.success("Order created", {
        description: `${order.order_number} · awaiting payment`,
      });
    },
  });
}

export function useCancelOrder() {
  const invalidate = useInvalidateOrderWorkflow();
  return useMutation({
    mutationFn: (id) => cancelOrder(id),
    onSuccess: (_data, id) => {
      invalidate(id);
      toast.success("Order cancelled");
    },
    onError: (error) =>
      toast.error("Order could not be cancelled", {
        description: getApiErrorMessage(error),
      }),
  });
}
