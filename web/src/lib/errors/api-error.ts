export type ApiErrorOptions = {
  status?: number;
  info?: Record<string, unknown>;
  name?: string;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly info?: Record<string, unknown>;
  readonly headers?: Record<string, string>;

  constructor(message: string, { status, info, name, headers }: ApiErrorOptions = {}) {
    super(message);
    this.name = name ?? 'ApiError';
    this.status = status ?? 500;
    this.info = info;
    this.headers = headers;
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.status,
      info: this.info,
    };
  }

  static fromJSON(json: ReturnType<typeof ApiError.prototype.toJSON>): ApiError {
    if (!isApiErrorJson(json)) {
      return new ApiError('Unknown API error.', {
        status: 500,
        info: { json },
      });
    }

    return new ApiError(json.message, {
      name: json.error,
      status: json.statusCode,
      info: json.info,
    });
  }
}

/**
 * Helper function to check if a JSON object is a valid ApiError JSON.
 */
function isApiErrorJson(json: unknown): json is ReturnType<typeof ApiError.prototype.toJSON> {
  return (
    typeof json === 'object' &&
    json !== null &&
    'error' in json &&
    typeof json.error === 'string' &&
    'message' in json &&
    typeof json.message === 'string' &&
    'statusCode' in json &&
    typeof json.statusCode === 'number'
  );
}
