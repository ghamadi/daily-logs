import { createDb } from '@db/client/create-db';

let dbSingleton: ReturnType<typeof createDb> | undefined;

export function getDb(): ReturnType<typeof createDb> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set.');
  }

  dbSingleton ??= createDb(connectionString);
  return dbSingleton;
}
