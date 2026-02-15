/**
 * This file is meant to be run as a script to test the connection to the database.
 *
 * Usage:
 * ```bash
 * pnpm run db:test-connection
 * ```
 */

/* eslint-disable no-console */
import { testConnection } from '@db/client/test-connection';

(async () => {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    console.error('[Database] DATABASE_URL is not set');
    return process.exit(1);
  }

  console.info('[Database] Testing connection to the database...');

  try {
    await testConnection(connectionString);
    console.info('[Database] Connection successful 🎉');
    process.exit(0);
  } catch (error) {
    console.error('[Database] Failed to connect to the database 😢:\n', error);
    process.exit(1);
  }
})();
