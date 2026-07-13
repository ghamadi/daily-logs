import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { AuthProvider } from '@daily-logs/domains/users';

import { E2E_SESSION_COOKIE_NAME, encodeE2eSessionCookieValue } from '@/lib/testing/e2e-auth';
import { loadLocalEnvFiles } from '../test/server/helpers/load-local-env-files';
import {
  insertAuthIdentity,
  insertUser,
  insertWorkspaceWithOwner,
} from '../test/server/helpers/seed-data';
import {
  closeTestDatabase,
  resetTestDatabase,
  waitForTestDatabase,
} from '../test/server/helpers/test-database';
import { E2E_USER, E2E_USER_DISPLAY_NAME, E2E_WORKSPACE_NAME, STORAGE_STATE_PATH } from './fixtures';

/**
 * Playwright global setup -- passed to the playwright config.
 * Runs once per `playwright test` invocation in order to:
 *  1. reset the test DB to a clean state,
 *  2. seed a fixed principal + auth identity + workspace,
 *  3. write an authenticated storageState to disk for the specs to load.
 */
async function globalSetup() {
  // Load .env files so TEST_DATABASE_URL is available (CI injects it directly).
  loadLocalEnvFiles(process.cwd());

  // Fail fast (~3s) with the established clear error if the container is down,
  // rather than letting the seed hang.
  await waitForTestDatabase({ retries: 3, delayMs: 1_000 });

  await resetTestDatabase();

  const user = await insertUser({
    email: E2E_USER.email,
    displayName: E2E_USER_DISPLAY_NAME,
  });

  await Promise.all([
    insertAuthIdentity({
      userId: user.id,
      provider: AuthProvider.Supabase,
      providerUserId: E2E_USER.sub,
    }),
    insertWorkspaceWithOwner({
      ownerUserId: user.id,
      name: E2E_WORKSPACE_NAME,
    }),
  ]);

  const storageState = {
    cookies: [
      {
        name: E2E_SESSION_COOKIE_NAME,
        value: encodeE2eSessionCookieValue(E2E_USER),
        domain: 'localhost',
        path: '/',
        expires: -1,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const,
      },
    ],
    origins: [],
  };

  await mkdir(dirname(STORAGE_STATE_PATH), { recursive: true });
  await writeFile(STORAGE_STATE_PATH, JSON.stringify(storageState, null, 2));

  // Close the pool so this setup process exits cleanly.
  await closeTestDatabase();
}

// Playwright's `globalSetup` loader requires the setup function to be the file's default export
export default globalSetup;
