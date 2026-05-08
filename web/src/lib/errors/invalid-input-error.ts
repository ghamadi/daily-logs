import { ApiError, type ApiErrorOptions } from './api-error';

export class InvalidInputError extends ApiError {
  constructor(message: string, options?: ApiErrorOptions) {
    super(message, { status: 400, name: 'InvalidInputError', ...options });
  }
}
