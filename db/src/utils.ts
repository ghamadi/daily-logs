import { sql } from 'drizzle-orm';
import { getObjectValues } from '@utils/ts-utils';

/**
 * Utility function to convert an enum to a SQL enum values string.
 *
 * This function is meant for internal use only within the database schema.
 * We use it mainly to add checks to the schema to ensure the values are valid.
 * It is NOT meant to be used for sanitizing user input.
 *
 * @param enumLike - The enum to convert to a SQL enum values string.
 * @returns The SQL enum values string.
 */
export function sqlEnumValues(enumLike: Record<string, string | number>) {
  return sql.raw(
    getObjectValues(enumLike)
      .map((value) => (typeof value === 'number' ? `${value}` : `'${value.replace(/'/g, "''")}'`))
      .join(', '),
  );
}
