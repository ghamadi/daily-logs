import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export type DbClient = ReturnType<typeof postgres>;

export function createDb(connectionString: string) {
  const client = postgres(connectionString);
  const db = drizzle(client);

  return {
    db,
    close: client.end,
  };
}
