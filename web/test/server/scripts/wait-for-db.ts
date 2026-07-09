import { getDatabaseUrl } from '@daily-logs/db/client';
import { loadLocalEnvFiles } from '../helpers/load-local-env-files';
import { closeTestDatabase, waitForTestDatabase } from '../helpers/test-database';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
loadLocalEnvFiles(rootDir);

(async () => {
  console.info(`[Test DB] Waiting for database at ${getDatabaseUrl()}...`);
  await waitForTestDatabase();
  await closeTestDatabase();
  console.info('[Test DB] Database is ready.');
})().catch(async (error) => {
  console.error('[Test DB] Database did not become ready:\n', error);
  await closeTestDatabase();
  process.exit(1);
});
