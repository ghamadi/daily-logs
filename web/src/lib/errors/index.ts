import { ApiError } from './api-error';
import { ForbiddenAccessError, UnauthorizedError } from './auth-error';
import { BadRequestError } from './bad-request-error';
import { ConflictError } from './conflict-error';
import { InternalError } from './internal-error';
import { InvalidInputError } from './invalid-input-error';
import { NotFoundError } from './not-found-error';
import { TooManyRequestsError } from './too-many-requests-error';

export { ApiError };

export const ApiErrors = {
  InvalidInputError,
  UnauthorizedError,
  ForbiddenAccessError,
  NotFoundError,
  BadRequestError,
  TooManyRequestsError,
  ConflictError,
  InternalServerError: InternalError,
} as const satisfies Record<string, typeof ApiError>;
