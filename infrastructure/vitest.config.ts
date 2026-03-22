import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const currentDir = dirname(fileURLToPath(import.meta.url));
const fromCurrentDir = (...segments: string[]) => resolve(currentDir, ...segments);

export default defineConfig({
  resolve: {
    alias: {
      '@db': fromCurrentDir('../db/src'),
      '@domains': fromCurrentDir('../domains/src'),
      '@infrastructure': fromCurrentDir('./src'),
      '@utils': fromCurrentDir('../utils/src'),
      '@web': fromCurrentDir('../web/src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 30_000,
    setupFiles: ['./test/setup.ts'],
    include: ['./test/**/*.test.ts'],
  },
});
