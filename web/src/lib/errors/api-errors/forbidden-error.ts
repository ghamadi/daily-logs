import { ApiError } from './api-error';

export class ForbiddenError extends ApiError {
  readonly code = 403;

  constructor(message: string, info?: Record<string, unknown>) {
    super(message, info);
  }
}
