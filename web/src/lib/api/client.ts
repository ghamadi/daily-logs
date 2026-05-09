import { ApiError } from '@web/lib/errors/api-error';

export type ApiFetchInit = Omit<RequestInit, 'body'> & {
  /** Plain object — `apiFetch` JSON-encodes it for you. Pass a string/FormData via `rawBody` instead. */
  body?: unknown;
  rawBody?: BodyInit;
};

/**
 * Thin client-side wrapper around `fetch` that:
 *
 * - JSON-encodes the request body and sets `Content-Type` for you.
 * - Unwraps our canonical `{ data }` envelope so callers receive the typed payload.
 * - Re-hydrates non-2xx responses through `ApiError.fromJSON`, so React Query's
 *   `error` is always an `ApiError` and components can read `error.status` /
 *   `error.info` instead of stringly-typed status checks.
 *
 * Use as the `mutationFn` / `queryFn` directly:
 *
 * ```ts
 * useMutation({
 *   mutationFn: (input: CreateWorkspaceRequestBody) =>
 *     apiFetch<Workspace>('/api/workspaces', { method: 'POST', body: input }),
 * });
 * ```
 */
export async function apiFetch<TData = unknown>(
  input: RequestInfo | URL,
  init: ApiFetchInit = {},
): Promise<TData> {
  const { body, rawBody, headers, ...rest } = init;

  if (body !== undefined && rawBody !== undefined) {
    throw new Error('apiFetch: pass either `body` or `rawBody`, not both.');
  }

  const finalHeaders = new Headers(headers);
  let finalBody: BodyInit | undefined;
  if (rawBody !== undefined) {
    finalBody = rawBody;
  } else if (body !== undefined) {
    finalBody = JSON.stringify(body);
    if (!finalHeaders.has('Content-Type')) {
      finalHeaders.set('Content-Type', 'application/json');
    }
  }

  const response = await fetch(input, { ...rest, headers: finalHeaders, body: finalBody });

  if (response.status === 204) {
    // No body to parse; callers that ask for a typed payload here are
    // misusing the helper, but `void`/`undefined` returns are valid for
    // DELETE-style operations.
    return undefined as TData;
  }

  const payload = await readJson(response);

  if (!response.ok) {
    // ApiError.fromJSON tolerates malformed payloads (it falls back to a
    // generic 500), so this is safe even when the server returns garbage.
    throw ApiError.fromJSON(payload as ReturnType<typeof ApiError.prototype.toJSON>);
  }

  // Successful responses always go through `toApiResponse`, so the shape is
  // `{ data, ...optionalParams }`. We only return `data` to keep call sites
  // tidy; if a route later needs to surface params, expose a sibling helper.
  if (isEnvelope(payload)) {
    return payload.data as TData;
  }

  // Defensive fallback: a 2xx response that doesn't follow the envelope
  // convention (e.g. a streaming endpoint we accidentally fetch as JSON).
  // Returning the raw payload is more useful than throwing, and TypeScript
  // already forces the caller to declare the shape.
  return payload as TData;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isEnvelope(payload: unknown): payload is { data: unknown } {
  return typeof payload === 'object' && payload !== null && 'data' in payload;
}
