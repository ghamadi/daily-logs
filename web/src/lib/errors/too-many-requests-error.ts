import { ApiError, type ApiErrorOptions } from './api-error';

export class TooManyRequestsError extends ApiError {
  constructor(message: string, options?: ApiErrorOptions) {
    super(message, { status: 429, name: 'TooManyRequestsError', ...options });
  }
}
