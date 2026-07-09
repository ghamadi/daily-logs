import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { loadLocalEnvFiles } from './test/server/helpers/load-local-env-files';

const currentDir = dirname(fileURLToPath(import.meta.url));
const fromCurrentDir = (...segments: string[]) => resolve(currentDir, ...segments);

loadLocalEnvFiles(currentDir);

export default defineConfig({
  resolve: {
    // Mirror web/tsconfig.json `paths` so tests can import app code and the
    // workspace deps it pulls in (whose raw .ts source uses these aliases).
    // Vitest does not read tsconfig `paths`, so they must be declared here too.
    alias: {
      '@': fromCurrentDir('./src'),
      '@infrastructure': fromCurrentDir('./src/lib/infrastructure'),
      '@domains': fromCurrentDir('../domains/src'),
      '@db': fromCurrentDir('../db/src'),
      // Centralized test harness/helpers, imported by co-located `__tests__` suites.
      '@test': fromCurrentDir('./test'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 30_000,
    setupFiles: ['./test/server/setup.ts'],
    // Harness/smoke suites live under test/server; feature suites are co-located
    // next to the code they cover, under `__tests__` folders.
    include: ['./test/server/**/*.test.ts', './src/**/__tests__/**/*.test.ts'],
    passWithNoTests: true,
  },
});
