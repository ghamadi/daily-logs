import { UnexpectedError } from './unexpected-error';
import { AccessDeniedError } from './access-denied-error';
import { ConflictError } from './conflict-error';
import { DomainError } from './domain-error';
import { EntityNotFoundError } from './entity-not-found-error';
import { InvalidInputError } from './invalid-input-error';

export const DomainErrors = {
  InvalidInputError,
  NotFoundError: EntityNotFoundError,
  AccessDeniedError,
  ConflictError,
  UnexpectedError,
} as const satisfies Record<string, typeof DomainError>;

export { DomainError };
