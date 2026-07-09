export function getDatabaseUrl(): string {
  const isTestEnv = process.env.NODE_ENV === 'test';
  const envVarName = isTestEnv ? 'TEST_DATABASE_URL' : 'DATABASE_URL';
  const connectionString = process.env[envVarName];
  if (!connectionString) {
    throw new Error(`${envVarName} is not set.`);
  }
  return connectionString;
}
