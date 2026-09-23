import { QueryClient } from '@tanstack/react-query';

// Server-state cache for the Service Layer (React Query). Defaults favor a
// dashboard-style app: data is fresh enough to skip refetch-on-focus churn,
// but still revalidates on reconnect and on explicit invalidation.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
