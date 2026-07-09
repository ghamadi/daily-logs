import { afterAll, beforeAll, beforeEach } from 'vitest';

import { closeTestDatabase, resetTestDatabase, waitForTestDatabase } from './helpers/test-database';

beforeAll(async () => {
  // `pnpm test` runs `db:test:prepare` first, so by the time the suite boots the
  // database is already up. A short retry budget keeps a happy-path check while
  // failing fast (a few seconds, not 30) when someone runs the suite with no DB.
  await waitForTestDatabase({ retries: 5, delayMs: 500 });
});

beforeEach(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});
