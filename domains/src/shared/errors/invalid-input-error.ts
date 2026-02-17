import { DomainError } from './domain-error';

export class InvalidInputError extends DomainError {
  readonly code = 'INVALID_INPUT' as const;

  constructor(message: string, info?: Record<string, unknown>) {
    super(message, info);
  }

  static create(props: { field: string; reason: string }): InvalidInputError {
    const { field, reason } = props;
    return new InvalidInputError(`Invalid input for "${field}": ${reason}`, { field, reason });
  }
}
