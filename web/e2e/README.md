# E2E harness (Playwright)

Smoke tests that drive the real Next.js app against the **test database**,
exercising the full authenticated path (browser → proxy → server components → Postgres).
Intended as the reusable pattern for later UI suites.

## Auth: an env-gated test bypass

E2E doesn't run Google OAuth or Supabase — an authenticated session is injected
via a test-only cookie instead:

- When the bypass flag is on (which can only happen in non-production environments),
  the two auth entry points — ([the proxy page gate (`supabase-session.ts`)](../src/lib/middleware/supabase-session.ts))
  and ([the server-side principal resolver (`api/auth.ts`)](../src/lib/utils/api/auth.ts)) —
  trust the test cookie instead of verifying a Supabase JWT. The cookie and the
  flag are defined in [`e2e-auth.ts`](../src/lib/testing/e2e-auth.ts).
- The bypass **only** skips JWT verification. Everything after it — resolving the
  cookie to a user through the production `getOrCreateUser` path, then the DB
  reads — runs unchanged, so the tests exercise real code.
- It's safe because the flag is server-only and inert in production; the cookie
  is trusted nowhere except a local test server that opts in.

## How a run works

`playwright.config.ts` starts the app (`webServer`) pointed at the test DB with
the bypass enabled. Global setup ([`global-setup.ts`](./global-setup.ts)) then
runs once per invocation to reset and seed the DB and write the authenticated
`storageState` the specs load.

DB reset and seeding reuse the **same** helpers as the vitest integration suite
([`test/server/helpers`](../test/server/helpers)) — one source of truth. Shared
constants (the seeded identity, workspace name) live in [`fixtures.ts`](./fixtures.ts);
import them so specs and the seed can't drift.

## Running

- `pnpm test:e2e` — brings the DB container up, migrates, then runs the suite.
- `pnpm test:e2e:headed` does the same with a visible browser.
- E2E tests are excluded from `pnpm test` by design.

## Extending

Add specs under `e2e/`, import constants from `fixtures.ts`, and assert on
user-visible behavior (URLs, roles, text). The DB is reset and seeded **once per
run**, not per test — fine while suites only read the shared seed. A suite that
mutates it needs its own isolation (reset/re-seed per test, or its own
workspace/user).
