import { QueryClient } from "@tanstack/react-query";
import { getHttpStatus } from "./errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = getHttpStatus(error);
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});
