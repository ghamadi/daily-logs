import { NextRequest } from 'next/server';
import { vi } from 'vitest';

import type { DbUser } from '@daily-logs/db/schema';
import { User } from '@daily-logs/domains/users';

import { getAuthenticatedPrincipal } from '@/lib/utils/api/auth';

const TEST_ORIGIN = 'http://localhost';

/**
 * Point the mocked `getAuthenticatedPrincipal` at a seeded user, so subsequent
 * route-handler calls run as that principal. Call it again to switch principals
 * within a test.
 *
 * Requires the test file to mock the auth module at the top level:
 *
 *   vi.mock('@/lib/utils/api/auth', () => ({ getAuthenticatedPrincipal: vi.fn() }));
 *
 * The explicit factory matters: it keeps the real `auth.ts` (and its
 * `server-only` import) out of the test module graph.
 */
export function authenticateAs(user: DbUser | User): User {
  const principal = user instanceof User ? user : new User(user);
  vi.mocked(getAuthenticatedPrincipal).mockResolvedValue(principal);
  return principal;
}

/** Build a `NextRequest` for a route handler; JSON-encodes `body` when provided. */
export function buildRequest(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): NextRequest {
  const { method = 'GET', body, headers } = init;

  return new NextRequest(new URL(path, TEST_ORIGIN), {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Build the `{ params }` context Next passes as the second handler argument. */
export function routeContext<TParams extends Record<string, string>>(params: TParams) {
  return { params: Promise.resolve(params) };
}

/** Read a handler response and unwrap the canonical `{ data }` envelope. */
export async function readApiData<TData>(response: Response): Promise<TData> {
  const json = (await response.json()) as { data: TData };
  return json.data;
}
