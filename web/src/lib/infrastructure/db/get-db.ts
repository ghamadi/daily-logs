import { createDb, getDatabaseUrl, Database } from '@daily-logs/db/client';

let dbSingleton: Database | undefined;

/**
 * Returns the singleton database instance.
 *
 * We don't use createDb() directly, and we don't expose the `close` method,
 * to avoid creating a new connection pool for each call. Caching the instance,
 * and keeping the connection open during warm starts in a serverless environment like Vercel is preferred.
 */
export function getDb(): Database {
  const connectionString = getDatabaseUrl();

  dbSingleton ??= createDb(connectionString).db;
  return dbSingleton;
}
