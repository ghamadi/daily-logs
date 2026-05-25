import { z } from 'zod';

import { ApiErrors } from '@/lib/errors';

/**
 * Reads the JSON body from a Request and validates it against a Zod schema.
 *
 * - Invalid JSON -> `BadRequestError` (400 with a clear message).
 * - Schema mismatch -> `ZodError` (mapped by `withApiErrorHandler` to 400 with field issues).
 *
 * Returns the parsed, typed body so handlers can destructure directly.
 */
export async function parseJsonBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiErrors.BadRequestError('Request body must be valid JSON.');
  }

  return schema.parse(raw);
}
