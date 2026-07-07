import { ApiError, type ApiErrorOptions } from '@/lib/errors/api-error';

export class ConflictError extends ApiError {
  constructor(message: string, options?: ApiErrorOptions) {
    super(message, { status: 409, name: 'ConflictError', ...options });
  }
}
