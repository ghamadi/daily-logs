import { resolve } from 'node:path';

/**
 * Shared constants for the E2E harness. Both `global-setup.ts` (which seeds the
 * DB and writes storageState) and the specs import from here, so the seeded
 * identity and the cookie always agree — a mismatch would make the bypass
 * resolve to a freshly-created user instead of the seeded one.
 */

// Fixed auth identity. `sub` is the Supabase user id (providerUserId) and must
// match both the seeded auth identity and the injected cookie payload.
export const E2E_USER = {
  sub: 'e2e-supabase-user',
  email: 'e2e@example.com',
} as const;

export const E2E_USER_DISPLAY_NAME = 'E2E User';

export const E2E_WORKSPACE_NAME = 'E2E Workspace';

export const BASE_URL = 'http://localhost:3100';

// Where global setup writes the authenticated storageState Playwright loads.
// Playwright transpiles specs/config to CJS, so use the CJS-provided `__dirname`
// (this file's directory, i.e. web/e2e) rather than `import.meta`.
export const STORAGE_STATE_PATH = resolve(__dirname, '.auth/user.json');
