import { ApiError, type ApiErrorOptions } from '@/lib/errors/api-error';

export class InternalError extends ApiError {
  constructor(message: string, options?: ApiErrorOptions) {
    super(message, { status: 500, name: 'InternalServerError', ...options });
  }
}
