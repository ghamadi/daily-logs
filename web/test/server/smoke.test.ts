import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { getTestDatabase } from './helpers/test-database';

/**
 * Tables the baseline migration is expected to create in the `public` schema.
 * Keep this in sync with `db/src/schema` so a dropped/renamed table trips the
 * smoke test instead of surfacing as a confusing failure in a feature suite.
 */
const EXPECTED_TABLES = [
  'auth_identities',
  'chat_messages',
  'chats',
  'events',
  'users',
  'workspace_users',
  'workspaces',
] as const;

describe('test database smoke test', () => {
  it('accepts a trivial query', async () => {
    const { db } = getTestDatabase();

    const rows = await db.execute<{ result: number }>(sql`SELECT 1 AS result`);

    expect(rows[0]?.result).toBe(1);
  });

  it('has the tables created by migrations', async () => {
    const { db } = getTestDatabase();

    const rows = await db.execute<{ table_name: string }>(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tableNames = rows.map((row) => row.table_name);

    expect(tableNames).toEqual(expect.arrayContaining([...EXPECTED_TABLES]));
  });
});
