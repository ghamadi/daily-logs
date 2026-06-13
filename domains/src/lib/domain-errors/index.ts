import { UnexpectedError } from '@/lib/domain-errors/unexpected-error';
import { AccessDeniedError } from '@/lib/domain-errors/access-denied-error';
import { ConflictError } from '@/lib/domain-errors/conflict-error';
import { DomainError } from '@/lib/domain-errors/domain-error';
import { EntityNotFoundError } from '@/lib/domain-errors/entity-not-found-error';
import { InvalidInputError } from '@/lib/domain-errors/invalid-input-error';

export const DomainErrors = {
  InvalidInputError,
  NotFoundError: EntityNotFoundError,
  AccessDeniedError,
  ConflictError,
  UnexpectedError,
} as const satisfies Record<string, typeof DomainError>;

export { DomainError };
