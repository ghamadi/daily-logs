export type ValueOf<T> = T[keyof T];

/**
 * Usage: Enum<typeof MessageChannel> -> 0 | 1 | 2 | 3
 */
export type Enum<T extends Record<string, string | number>> = ValueOf<T>;

export function getObjectKeys<T extends object>(value: T): Array<keyof T> {
  return Object.keys(value) as Array<keyof T>;
}

export function getObjectValues<T extends Record<PropertyKey, unknown>>(value: T) {
  return Object.values(value) as Array<T[keyof T]>;
}

export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value != null;
}

export function assertUnreachable(value: never, message?: string): never {
  throw new Error(message ?? `Reached an unexpected code path. Received value: ${String(value)}`);
}
