import { DomainError } from './domain-error';

export class EntityNotFoundError extends DomainError {
  readonly code = 'ENTITY_NOT_FOUND' as const;

  constructor(message: string, info?: Record<string, unknown>) {
    super(message, info);
  }

  static create(props: { entity: string; identifier: string }): EntityNotFoundError {
    const { entity, identifier } = props;
    return new EntityNotFoundError(`${entity} not found: ${identifier}`, { entity, identifier });
  }
}
