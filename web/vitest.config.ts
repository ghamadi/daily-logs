import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const currentDir = dirname(fileURLToPath(import.meta.url));
const fromCurrentDir = (...segments: string[]) => resolve(currentDir, ...segments);
const fromRepoRoot = (...segments: string[]) => resolve(currentDir, '..', ...segments);

export default defineConfig({
  resolve: {
    alias: {
      '@web': fromCurrentDir('./src'),
      '@db': fromRepoRoot('db/src'),
      '@domains': fromRepoRoot('domains/src'),
      '@utils': fromRepoRoot('utils/src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 30_000,
    setupFiles: ['./test/server/setup.ts'],
    include: ['./test/server/**/*.test.ts'],
    passWithNoTests: true,
  },
});
