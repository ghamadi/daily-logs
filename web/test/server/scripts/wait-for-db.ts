import { getDatabaseUrl } from '@daily-logs/db/client';
import { loadLocalEnvFiles } from '../helpers/load-local-env-files';
import { closeTestDatabase, waitForTestDatabase } from '../helpers/test-database';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
loadLocalEnvFiles(rootDir);

/**
 * Wait for the test database to be ready.
 * Used by the `pnpm db:test:prepare` script to wait for the database to be ready before running migrations.
 */
(async () => {
  console.info(`[Test DB] Waiting for database at ${getDatabaseUrl({ env: 'test' })}...`);
  await waitForTestDatabase();
  await closeTestDatabase();
  console.info('[Test DB] Database is ready.');
})().catch(async (error) => {
  console.error('[Test DB] Database did not become ready:\n', error);
  await closeTestDatabase();
  process.exit(1);
});
