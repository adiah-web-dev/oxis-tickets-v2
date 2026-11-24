import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "../lib/errors";
import { queryKeys } from "../lib/queryKeys";
import {
  listOrderPayments,
  listPayments,
  recordPayment,
  rejectPayment,
  verifyPayment,
  voidPayment,
} from "../services/paymentService";
import { useInvalidateOrderWorkflow } from "./useOrders";

export function usePayments(params) {
  return useQuery({
    queryKey: queryKeys.payments.list(params),
    queryFn: () => listPayments(params),
    placeholderData: keepPreviousData,
  });
}

export function useOrderPayments(orderId, options = {}) {
  return useQuery({
    queryKey: [...queryKeys.payments.all, "order", orderId],
    queryFn: () => listOrderPayments(orderId),
    enabled: !!orderId && (options.enabled ?? true),
  });
}

export function useRecordPayment() {
  const invalidate = useInvalidateOrderWorkflow();
  return useMutation({
    mutationFn: (payload) => recordPayment(payload),
    onSuccess: (payment) => {
      invalidate(payment.order);
      toast.success("Payment recorded", {
        description: "It now needs verification by an event manager.",
      });
    },
  });
}

export function useVerifyPayment() {
  const invalidate = useInvalidateOrderWorkflow();
  return useMutation({
    mutationFn: (payment) => verifyPayment(payment.id),
    onSuccess: (_data, payment) => {
      invalidate(payment.order);
      toast.success("Payment verified", {
        description:
          "If the order is now fully paid, tickets are generated and emailed automatically.",
      });
    },
    onError: (error) =>
      toast.error("Payment could not be verified", {
        description: getApiErrorMessage(error),
      }),
  });
}

export function useRejectPayment() {
  const invalidate = useInvalidateOrderWorkflow();
  return useMutation({
    mutationFn: (payment) => rejectPayment(payment.id),
    onSuccess: (_data, payment) => {
      invalidate(payment.order);
      toast.success("Payment rejected");
    },
    onError: (error) =>
      toast.error("Payment could not be rejected", {
        description: getApiErrorMessage(error),
      }),
  });
}

export function useVoidPayment() {
  const invalidate = useInvalidateOrderWorkflow();
  return useMutation({
    mutationFn: ({ payment, reason }) => voidPayment(payment.id, reason),
    onSuccess: (_data, variables) => {
      invalidate(variables.payment.order);
      toast.success("Payment voided", {
        description:
          "It remains in the payment history but is excluded from revenue.",
      });
    },
    onError: (error) =>
      toast.error("Payment could not be voided", {
        description: getApiErrorMessage(error),
      }),
  });
}
