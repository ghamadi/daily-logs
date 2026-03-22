/* eslint-disable no-console */
import { closeTestDatabase, getTestDatabaseUrl, waitForTestDatabase } from '../helpers/test-database';

(async () => {
  console.info(`[Test DB] Waiting for database at ${getTestDatabaseUrl()}...`);
  await waitForTestDatabase();
  await closeTestDatabase();
  console.info('[Test DB] Database is ready.');
})().catch(async (error) => {
  console.error('[Test DB] Database did not become ready:\n', error);
  await closeTestDatabase();
  process.exit(1);
});
