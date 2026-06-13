import { DomainError } from '@domains/lib/errors/domain-error';

export class EntityNotFoundError extends DomainError {
  readonly code = 'ENTITY_NOT_FOUND' as const;
}
