import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ApiResponse<TData, TParams extends Record<string, unknown> = {}> = {
  data: TData;
} & TParams;

/**
 * Converts input to the canonical API response format.
 *
 * @returns the input wrapped in a JSON response with `{ data: <input> }` as the body.
 */
export function toApiResponse<TData, TParams extends Record<string, unknown>>(
  data: TData,
  options?: { params?: TParams; responseInit?: ResponseInit },
) {
  const { params, responseInit } = options ?? {};

  if (params && 'data' in params) {
    throw new Error(
      '`data` cannot be in the `params` object. We reserve the `data` key for the main payload.',
    );
  }

  return NextResponse.json({ data, ...params } satisfies ApiResponse<TData>, responseInit);
}
