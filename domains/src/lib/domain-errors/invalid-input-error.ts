import { DomainError } from '@/lib/domain-errors/domain-error';

export class InvalidInputError extends DomainError {
  readonly code = 'INVALID_INPUT' as const;
}
