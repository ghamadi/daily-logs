import { DomainError } from '@domains/lib/errors/domain-error';

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT' as const;
}
