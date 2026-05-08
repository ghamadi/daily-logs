import { DomainError } from './domain-error';

export class UnexpectedError extends DomainError {
  readonly code = 'UNEXPECTED_ERROR' as const;
}
