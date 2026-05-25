import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiError, ApiErrors } from '@/lib/errors';
import { DomainErrors, DomainError } from '@domains/lib/errors';

/**
 * Useful for defining the input and output of the `withErrorResponse` HOF.
 */
type ApiRequestHandler<TArgs extends unknown[], TResult> = (...args: TArgs) => TResult;

/**
 * A higher-order function to handle errors in server-side request handlers (e.g. API routes & middleware)
 *
 * All errors thrown inside the wrapped function will be converted to ApiError,
 * and returned as a JSON response with the appropriate status code.
 */
export function withApiErrorHandler<
  TArgs extends unknown[],
  TResult,
  TResponse extends TResult | NextResponse,
>(fn: ApiRequestHandler<TArgs, TResponse>) {
  return (async (...args: TArgs) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error);
      const apiError = convertErrorToApiError(error);
      return NextResponse.json(apiError.toJSON(), {
        status: apiError.status,
        headers: apiError.headers,
      });
    }
  }) as ApiRequestHandler<TArgs, TResponse>;
}

/**
 * Logs error details to the console;
 * handling ApiError, ZodError, standard Error, and unknown errors appropriately.
 */
export function logError(error: unknown) {
  if (error instanceof ApiError) {
    console.error('[Api Error]', error.toJSON());
    return;
  }

  if (error instanceof DomainError) {
    console.error('[Domain Error]', error.toJSON());
    return;
  }

  if (error instanceof z.ZodError) {
    console.error('[Zod Error]', error.message, '\n\t', getZodIssues(error).join('\n\t'));
    return;
  }

  if (error instanceof Error) {
    console.error('[Error]', error.message);
    return;
  }

  console.error('[Unknown Error]', String(error));
}

export function translateAccessDeniedToNotFoundAndThrow(error: unknown, message: string): never {
  if (error instanceof DomainErrors.AccessDeniedError || error instanceof DomainErrors.NotFoundError) {
    throw new DomainErrors.NotFoundError(message);
  }
  throw error;
}
// ============================================
// Internal Helper Functions
// ============================================

/**
 * Converts an error to an ApiError
 */
function convertErrorToApiError<T extends Error>(error: T | unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof z.ZodError) {
    return new ApiErrors.InvalidInputError('Invalid Input', {
      info: { issues: getZodIssues(error) },
    });
  }

  if (error instanceof DomainError) {
    return convertDomainErrorToApiError(error);
  }

  if (error instanceof Error) {
    return new ApiErrors.InternalServerError('Internal Server Error');
  }

  return new ApiErrors.InternalServerError('An unknown error occurred');
}

function convertDomainErrorToApiError(error: DomainError): ApiError {
  const { info, message } = error;
  const args = [message, { info }] as const;

  if (error instanceof DomainErrors.AccessDeniedError) {
    return new ApiErrors.ForbiddenAccessError(...args);
  }

  if (error instanceof DomainErrors.ConflictError) {
    return new ApiErrors.ConflictError(...args);
  }

  if (error instanceof DomainErrors.NotFoundError) {
    return new ApiErrors.NotFoundError(...args);
  }

  if (error instanceof DomainErrors.InvalidInputError) {
    return new ApiErrors.BadRequestError(...args);
  }

  // We do not pass info to the InternalServerError to avoid leaking sensitive information to the client.
  // All errors are logged before the conversion, so `info` is not lost.
  return new ApiErrors.InternalServerError('An unknown error occurred.');
}

function getZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join('.');
    const prefix = path ? `${path}: ` : '';
    return `${prefix}${issue.message}`;
  });
}
