import { ApiError } from './api-error';

export class UnauthorizedError extends ApiError {
  readonly code = 401;

  constructor(message: string, info?: Record<string, unknown>) {
    super(message, info);
  }
}
