import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import parser from '@typescript-eslint/parser';

const codeFiles = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
const packageFiles = (pkg) => codeFiles.map((file) => `${pkg}/${file}`);

// Alias/source-path forms of a package's internals, e.g. `@domains/chats/...`,
// `../../domains/src/...`. These are only valid inside the owning package.
const fromPackage = (...packages) =>
  packages.map((pkg) => [`@${pkg}/**`, `**/${pkg}/src/**`]).flat();

// Workspace-dependency forms, e.g. `@daily-logs/domains`, `@daily-logs/domains/chats`.
const packageExports = (...packages) =>
  packages.map((pkg) => [`@daily-logs/${pkg}`, `@daily-logs/${pkg}/**`]).flat();

export const noRestrictedImports = [
  /**
   * Inter-package dependency rules (layering: web → domains → db → utils):
   *
   * - Cross-package imports must go through `@daily-logs/*` workspace exports, never
   *   through another package's internal alias (`@domains/*`, `@db/*`) or source paths.
   *   Alias mappings for other packages in a tsconfig are resolution-only: package
   *   exports point at raw .ts source, so a consumer's tsc compiles dependency source
   *   under the consumer's tsconfig and must be able to resolve the dependency's
   *   internal aliases.
   * - No reverse dependencies, NOT EVEN TYPES: a type-only import still pulls the
   *   foreign source file into every downstream package's compilation. `db` and
   *   `domains` must never import from `web` (this broke the monorepo typecheck once).
   * - `domains` may only import types from `db` (`@daily-logs/db/...`).
   * - `db` may not import from `domains` or `web`.
   * - `utils` may not import any other packages.
   * - `mobile` may only import from `web` for API response types (`mobile` should
   *   never hit the database directly).
   */
  {
    files: packageFiles('db'),
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                ...fromPackage('web', 'mobile', 'infrastructure', 'domains'),
                ...packageExports('web', 'mobile', 'domains'),
              ],
              message:
                'The db package must not import from web, mobile, or domains — not even types (foreign source breaks downstream typechecks).',
            },
          ],
        },
      ],
    },
  },
  {
    files: packageFiles('infrastructure'),
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [...fromPackage('web', 'mobile'), ...packageExports('web', 'mobile')],
              message: 'The infrastructure package must not import from web or mobile.',
            },
          ],
        },
      ],
    },
  },
  {
    files: packageFiles('domains'),
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                ...fromPackage('web', 'mobile', 'infrastructure'),
                ...packageExports('web', 'mobile'),
              ],
              message:
                'The domains package must not import from web or mobile — not even types (foreign source breaks downstream typechecks).',
            },
            {
              group: fromPackage('db'),
              message:
                'Import from db via @daily-logs/db exports; the @db/* alias and db source paths are internal to the db package.',
            },
            {
              group: packageExports('db'),
              allowTypeImports: true,
              message: 'The domains package may only import types from db.',
            },
          ],
        },
      ],
    },
  },
  {
    files: packageFiles('mobile'),
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                ...fromPackage('db', 'domains', 'infrastructure', 'web'),
                ...packageExports('db', 'domains'),
              ],
              message: 'The mobile package must not import from db, domains, infrastructure, or web.',
            },
          ],
        },
      ],
    },
  },
  {
    files: packageFiles('utils'),
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                ...fromPackage('db', 'domains', 'infrastructure', 'mobile', 'web'),
                ...packageExports('db', 'domains', 'mobile', 'web'),
              ],
              message: 'The utils package must not import from other packages.',
            },
          ],
        },
      ],
    },
  },
  // The web package's 'no-restricted-imports' rules are defined in the `web/eslint.config.mjs` file.
];

const eslintConfig = [
  {
    files: codeFiles,
    languageOptions: {
      parser,
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      import: importPlugin,
    },
    rules: {
      'prefer-const': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'import/no-duplicates': 'warn',
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
          classes: true,
          variables: true,
          allowNamedExports: false,
        },
      ],
    },
  },
  ...noRestrictedImports,
];

export default eslintConfig;
