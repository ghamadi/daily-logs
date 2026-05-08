import { createDb, Database } from '@db/client/create-db';

let dbSingleton: Database | undefined;

/**
 * Returns the singleton database instance.
 *
 * We don't use createDb() directly, and we don't expose the `close` method,
 * to avoid creating a new connection pool for each call. Caching the instance,
 * and keeping the connection open during warm starts in a serverless environment like Vercel is preferred.
 */
export function getDb(): Database {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set.');
  }

  dbSingleton ??= createDb(connectionString).db;
  return dbSingleton;
}
