import { setTimeout as sleep } from 'node:timers/promises';
import { getTableName, is, sql, Table } from 'drizzle-orm';
import { createDb, getDatabaseUrl } from '@daily-logs/db/client';
import * as schema from '@daily-logs/db/schema';

let dbContext: ReturnType<typeof createDb> | undefined;

export function getTestDatabase(): ReturnType<typeof createDb> {
  dbContext ??= createDb(getDatabaseUrl({ env: 'test' }));
  return dbContext;
}

export async function waitForTestDatabase(props?: { retries?: number; delayMs?: number }) {
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

  throw new Error(`Unable to connect to the test database at ${getDatabaseUrl({ env: 'test' })}.`, {
    cause: lastError,
  });
}

export async function resetTestDatabase() {
  const { db } = getTestDatabase();

  // Derive the table list from the Drizzle schema.
  // Drizzle's own migrations table is never truncated.
  const tableNames = (Object.values(schema) as unknown[])
    .filter((value): value is Table => is(value, Table)) // keeps only the table objects (skip type-only exports)
    .map((table) => `"${getTableName(table).replace(/"/g, '""')}"`);

  if (tableNames.length > 0) {
    await db.execute(sql.raw(`TRUNCATE TABLE ${tableNames.join(', ')} RESTART IDENTITY CASCADE;`));
  }
}

export async function closeTestDatabase() {
  if (!dbContext) {
    return;
  }

  const { close } = dbContext;
  dbContext = undefined;
  await close();
}
