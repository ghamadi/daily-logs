/**
 * Utility type: extracts the union of values from an `as const` object.
 * Usage: Enum<typeof MessageChannel> -> 0 | 1 | 2 | 3
 */
export type Enum<T extends Record<string, string | number>> = T[keyof T];
