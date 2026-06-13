import { DomainError } from '@/lib/domain-errors/domain-error';

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT' as const;
}
