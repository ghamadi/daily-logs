export function requireRecord<T>(record: T | null | undefined, message: string): T {
  if (record == null) {
    throw new Error(message);
  }

  return record;
}
