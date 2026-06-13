import { DomainError } from '@domains/lib/errors/domain-error';

export class AccessDeniedError extends DomainError {
  readonly code = 'ACCESS_DENIED' as const;
}
