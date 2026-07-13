import { defineConfig } from '@playwright/test';

import { getDatabaseUrl } from '@daily-logs/db/client';

import { loadLocalEnvFiles } from './test/server/helpers/load-local-env-files';

// Playwright transpiles this config to CJS, so `import.meta` is unavailable —
// use the CJS-provided `__dirname` (this file's directory, i.e. web/).
// Mirror vitest.config.ts: pull TEST_DATABASE_URL and any Supabase vars from
// local .env files (skipped in CI, which injects vars directly).
loadLocalEnvFiles(__dirname);

// Resolve the test DB URL through the shared resolver rather than hardcoding a
// fallback here. This config's own process runs under NODE_ENV=development (it
// launches `next dev`), so we ask explicitly for the `test` environment's URL.
// A missing TEST_DATABASE_URL fails early with the same clear error the rest of
// the test tooling (db:test:migrate, global-setup) raises.
const testDatabaseUrl = getDatabaseUrl({ env: 'test' });

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  // Shared test DB, seeded once per run — do not parallelize across files.
  fullyParallel: false,
  workers: 1,
  outputDir: 'test-results',
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3100',
    storageState: 'e2e/.auth/user.json',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'pnpm dev --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // The app resolves its DB via getDb() -> process.env.DATABASE_URL. Under
      // the dev server (NODE_ENV=development) this is the single wiring point
      // that points the app at the test database.
      DATABASE_URL: testDatabaseUrl,
      // Turns on the test auth bypass for this server only. Never set elsewhere.
      E2E_AUTH_BYPASS: '1',
      // Dummy Supabase values keep the app booting without a real project — with
      // the bypass on, nothing actually calls Supabase.
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'e2e-dummy-key',
    },
  },
});
