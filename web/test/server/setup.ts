import { afterAll, beforeAll, beforeEach } from 'vitest';

import { closeTestDatabase, resetTestDatabase, waitForTestDatabase } from './helpers/test-database';

beforeAll(async () => {
  await waitForTestDatabase();
});

beforeEach(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});
