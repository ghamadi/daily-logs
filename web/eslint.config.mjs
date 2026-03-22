import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import baseConfig from '../eslint.config.mjs';

const mergedBaseRules = baseConfig
  .map((config) => config.rules ?? {})
  .reduce((acc, rules) => ({ ...acc, ...rules }), {});
const baseRulesWithoutRestrictedImports = { ...mergedBaseRules };
delete baseRulesWithoutRestrictedImports['no-restricted-imports'];

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
    files: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
    rules: {
      ...baseRulesWithoutRestrictedImports,
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@mobile/*', '**/mobile/src/*'],
              message: 'The web package must not import from mobile.',
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
