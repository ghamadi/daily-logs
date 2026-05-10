'use client';

import { environmentManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

/**
 * Canonical "App Router + React Query" provider, per the official Tanstack
 * guide. The split between server and browser singletons matters:
 *
 * - On the server we always create a new client so request-scoped data never
 *   leaks across requests.
 * - On the browser we lazily create one client for the lifetime of the tab so
 *   re-renders (e.g. Next layout transitions) don't blow away the cache.
 *
 * Wrapping at the `(protected)` layout (rather than the root layout) keeps
 * the provider out of the unauthenticated auth pages where it has no purpose.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // RSC pages already deliver fresh data on navigation; avoid an
        // unnecessary refetch the moment a `useQuery` first mounts.
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
