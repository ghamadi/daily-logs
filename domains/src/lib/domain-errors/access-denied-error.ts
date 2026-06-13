import { DomainError } from '@/lib/domain-errors/domain-error';

export class AccessDeniedError extends DomainError {
  readonly code = 'ACCESS_DENIED' as const;
}
