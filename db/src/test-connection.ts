import db from '.';

(async () => {
  try {
    // Attempt a simple query to test the connection
    await db.execute('SELECT 1');
    // eslint-disable-next-line no-console
    console.log('[Database] Connection successful 🎉');
    process.exit(0);
  } catch (error) {
    console.error('[Database] Failed to connect to the database 😢:\n', error);
    process.exit(1);
  }
})();
