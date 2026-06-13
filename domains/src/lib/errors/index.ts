import { UnexpectedError } from '@domains/lib/errors/unexpected-error';
import { AccessDeniedError } from '@domains/lib/errors/access-denied-error';
import { ConflictError } from '@domains/lib/errors/conflict-error';
import { DomainError } from '@domains/lib/errors/domain-error';
import { EntityNotFoundError } from '@domains/lib/errors/entity-not-found-error';
import { InvalidInputError } from '@domains/lib/errors/invalid-input-error';

export const DomainErrors = {
  InvalidInputError,
  NotFoundError: EntityNotFoundError,
  AccessDeniedError,
  ConflictError,
  UnexpectedError,
} as const satisfies Record<string, typeof DomainError>;

export { DomainError };
