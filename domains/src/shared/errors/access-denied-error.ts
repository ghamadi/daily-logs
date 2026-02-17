import { DomainError } from './domain-error';

export class AccessDeniedError extends DomainError {
  readonly code = 'ACCESS_DENIED' as const;

  constructor(reason: string) {
    super(reason);
  }
}
