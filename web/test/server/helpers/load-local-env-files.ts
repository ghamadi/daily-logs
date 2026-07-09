import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

const LOCAL_ENV_FILES = ['.env', '.env.local', '.env.test', '.env.test.local'] as const;

/**
 * Loads optional local env files via Node's native `process.loadEnvFile()`.
 * Skips missing files — CI runners inject vars directly instead.
 * Does not overwrite vars already present in the environment.
 */
export function loadLocalEnvFiles(rootDir: string): void {
  for (const fileName of LOCAL_ENV_FILES) {
    const filePath = resolve(rootDir, fileName);
    if (existsSync(filePath)) {
      loadEnvFile(filePath);
    }
  }
}
