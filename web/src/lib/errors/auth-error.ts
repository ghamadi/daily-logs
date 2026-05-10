import { ApiError, type ApiErrorOptions } from './api-error';

export class ForbiddenAccessError extends ApiError {
  constructor(message: string, options?: ApiErrorOptions) {
    super(message, { status: 403, name: 'ForbiddenAccessError', ...options });
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string, options?: ApiErrorOptions) {
    super(message, { status: 401, name: 'UnauthorizedError', ...options });
  }
}
