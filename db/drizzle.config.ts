import { defineConfig } from 'drizzle-kit';
import { getDatabaseUrl } from '@db/client';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
