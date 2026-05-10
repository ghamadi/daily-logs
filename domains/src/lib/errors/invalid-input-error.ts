import { DomainError } from './domain-error';

export class InvalidInputError extends DomainError {
  readonly code = 'INVALID_INPUT' as const;
}
