import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import baseConfig from '../eslint.config.mjs';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  {
    rules: {
      // We do not extend the baseConfig as-is to avoid conflicts from duplicate plugin declarations
      // Instead we only merge the rules here. The downside is that we need to make sure the base plugins
      // are also included in this config. However, since the base config is relatively stable, and Nextjs
      // already includes some of the same plugins, this should be manageable.
      ...baseConfig.map((config) => config.rules).reduce((acc, rules) => ({ ...acc, ...rules }), {}),
    },
  },
]);

export default eslintConfig;
