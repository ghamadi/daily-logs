import { ApiError, type ApiErrorOptions } from './api-error';

export class NotFoundError extends ApiError {
  constructor(message: string, options?: ApiErrorOptions) {
    super(message, { status: 404, name: 'NotFoundError', ...options });
  }
}
