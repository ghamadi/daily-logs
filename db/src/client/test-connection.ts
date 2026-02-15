import { createDb } from '@db/client/create-db';

/**
 * Test the connection to the database.
 * @param connectionString - The connection string to the database.
 */
export async function testConnection(connectionString: string): Promise<void> {
  const { db, close } = createDb(connectionString);

  try {
    await db.execute('SELECT 1');
  } finally {
    await close();
  }
}
