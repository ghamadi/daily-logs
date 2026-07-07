import { ApiError, type ApiErrorOptions } from '@/lib/errors/api-error';

export class BadRequestError extends ApiError {
  constructor(message: string, options?: ApiErrorOptions) {
    super(message, { status: 400, name: 'BadRequestError', ...options });
  }
}
