import { DomainError } from '@domains/lib/errors/domain-error';

export class UnexpectedError extends DomainError {
  readonly code = 'UNEXPECTED_ERROR' as const;
}
