import { expect, test } from '@playwright/test';

import { E2E_WORKSPACE_NAME } from './fixtures';

/**
 * Smoke suite proving the full authenticated loop:
 *   injected test cookie -> Edge proxy admits -> server component resolves the
 *   seeded principal -> real Postgres read renders the seeded workspace.
 *
 * Assertions are on user-visible behavior only (URLs, roles, text).
 */
test.describe('authenticated harness', () => {
  test('authenticated user reaches their workspace page', async ({ page }) => {
    await page.goto('/');

    // HomePage redirects to /workspaces once authenticated.
    await expect(page).toHaveURL(/\/workspaces$/);
    await expect(page.getByRole('heading', { name: 'Workspaces' })).toBeVisible();

    // The critical assertion: the seeded workspace is listed. This proves the
    // cookie resolved to the SEEDED user (getOrCreateUser matched the seeded
    // auth identity) and the page read real rows from the test DB.
    await expect(page.getByRole('link', { name: new RegExp(E2E_WORKSPACE_NAME) })).toBeVisible();
  });
});

test.describe('unauthenticated visitor', () => {
  // Drop the injected session for this block only.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('is redirected to login', async ({ page }) => {
    await page.goto('/');

    // Proves the bypass does not blanket-authenticate — only the cookie does.
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
