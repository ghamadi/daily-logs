import { DomainError } from '@/lib/domain-errors/domain-error';

export class UnexpectedError extends DomainError {
  readonly code = 'UNEXPECTED_ERROR' as const;
}
