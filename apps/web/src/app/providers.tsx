import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthBootstrap } from "../features/auth/useAuthBootstrap";
import { applyTheme, getStoredTheme } from "../lib/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

function Bootstrap({ children }: { children: ReactNode }) {
  useAuthBootstrap();
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);
  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Bootstrap>{children}</Bootstrap>
    </QueryClientProvider>
  );
}
