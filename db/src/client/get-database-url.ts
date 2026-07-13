/**
 * Resolves the database connection string from the environment.
 *
 * The selection is env-driven: under a `test` environment it reads
 * `TEST_DATABASE_URL`, otherwise `DATABASE_URL`. A missing variable throws
 * immediately with a clear message — callers never fall back to a hardcoded URL.
 *
 * `env` defaults to `process.env.NODE_ENV`, so ordinary callers pass nothing and
 * get behavior driven by their process env. Pass an explicit `env` only when a
 * process must resolve a *different* environment's URL than its own `NODE_ENV`
 * — e.g. the Playwright config runs under `development` but needs the test DB
 * URL to hand to the app's `DATABASE_URL`: `getDatabaseUrl({ env: 'test' })`.
 */
export function getDatabaseUrl(options?: { env?: string }): string {
  const env = options?.env ?? process.env.NODE_ENV;
  const isTestEnv = env === 'test';
  const envVarName = isTestEnv ? 'TEST_DATABASE_URL' : 'DATABASE_URL';
  const connectionString = process.env[envVarName];
  if (!connectionString) {
    throw new Error(`${envVarName} is not set.`);
  }
  return connectionString;
}
