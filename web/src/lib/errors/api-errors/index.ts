import { ApiError } from './api-error';
import { ForbiddenError } from './forbidden-error';
import { UnauthorizedError } from './unauthorized-error';

export const ApiErrors = {
  Forbidden: ForbiddenError,
  Unauthorized: UnauthorizedError,
} as const satisfies Record<string, typeof ApiError>;
