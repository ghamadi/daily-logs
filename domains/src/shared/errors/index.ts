import { InvalidInputError } from './invalid-input-error';
import { EntityNotFoundError } from './entity-not-found-error';
import { AccessDeniedError } from './access-denied-error';
import { DomainError } from './domain-error';

export const DomainErrors = {
  InvalidInput: InvalidInputError,
  EntityNotFound: EntityNotFoundError,
  AccessDenied: AccessDeniedError,
} as const satisfies Record<string, typeof DomainError>;
