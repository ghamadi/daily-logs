import { ApiError } from '@/lib/errors/api-error';
import { ForbiddenAccessError, UnauthorizedError } from '@/lib/errors/auth-error';
import { BadRequestError } from '@/lib/errors/bad-request-error';
import { ConflictError } from '@/lib/errors/conflict-error';
import { InternalError } from '@/lib/errors/internal-error';
import { InvalidInputError } from '@/lib/errors/invalid-input-error';
import { NotFoundError } from '@/lib/errors/not-found-error';
import { TooManyRequestsError } from '@/lib/errors/too-many-requests-error';

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
