/**
 * Asserts that a value is not null or undefined.
 *
 * @returns value if and only if it is not null or undefined
 * @throws an error if the value is null or undefined
 */
export function assertNotNullish<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value == null) {
    throw new Error(message);
  }
}

/**
 * Useful to ensure switch statements are exhaustive.
 *
 * @example
 * ```ts
 * const value = Math.random() > 0.5 ? 'a' : 'b';
 * switch (value) {
 *   case 'a':
 *     break;
 *   case 'b':
 *     break;
 *   default:
 *     // If there were a third case, the compiler would complain here because `value` would not be `never`
 *     assertUnreachable(value);
 * }
 * ```
 */
export function assertUnreachable(value: never, message?: string): never {
  throw new Error(message ?? `Reached an unexpected code path. Received value: ${String(value)}`);
}
