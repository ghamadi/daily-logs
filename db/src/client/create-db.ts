import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export type Database = ReturnType<typeof createDb>['db'];
export type Transaction<TDatabase extends Database = Database> = Parameters<
  Parameters<TDatabase['transaction']>[0]
>[0];

export function createDb(connectionString: string) {
  const client = postgres(connectionString);
  const db = drizzle(client);

  return {
    db,
    close: client.end,
  };
}
