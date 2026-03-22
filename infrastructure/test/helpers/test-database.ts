import { setTimeout as sleep } from 'node:timers/promises';
import { sql } from 'drizzle-orm';
import { createDb } from '@db/client/create-db';

const DEFAULT_TEST_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5443/daily_logs_test';

let dbContext: ReturnType<typeof createDb> | undefined;

export function getTestDatabaseUrl(): string {
  return process.env.TEST_DATABASE_URL?.trim() || DEFAULT_TEST_DATABASE_URL;
}

export function getTestDatabase(): ReturnType<typeof createDb> {
  dbContext ??= createDb(getTestDatabaseUrl());
  return dbContext;
}

export async function waitForTestDatabase(props?: { retries?: number; delayMs?: number }): Promise<void> {
  const retries = props?.retries ?? 30;
  const delayMs = props?.delayMs ?? 1_000;

  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const { db } = getTestDatabase();
      await db.execute(sql.raw('SELECT 1'));
      return;
    } catch (error) {
      lastError = error;
      await closeTestDatabase();

      if (attempt < retries) {
        await sleep(delayMs);
      }
    }
  }

  throw new Error(`Unable to connect to the test database at ${getTestDatabaseUrl()}.`, { cause: lastError });
}

export async function resetTestDatabase(): Promise<void> {
  const { db } = getTestDatabase();

  await db.execute(
    sql.raw(
      'TRUNCATE TABLE "auth_identities", "events", "workspace_users", "workspaces", "users" RESTART IDENTITY CASCADE;',
    ),
  );
}

export async function closeTestDatabase(): Promise<void> {
  if (!dbContext) {
    return;
  }

  const { close } = dbContext;
  dbContext = undefined;
  await close();
}
