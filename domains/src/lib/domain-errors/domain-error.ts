export abstract class DomainError extends Error {
  abstract readonly code: string;
  readonly info?: Record<string, unknown>;

  constructor(message: string, info?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.info = info;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      info: this.info,
    };
  }
}
