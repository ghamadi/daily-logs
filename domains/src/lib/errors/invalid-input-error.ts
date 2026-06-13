import { DomainError } from '@domains/lib/errors/domain-error';

export class InvalidInputError extends DomainError {
  readonly code = 'INVALID_INPUT' as const;
}
