import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import parser from '@typescript-eslint/parser';

const codeFiles = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
const packageFiles = (pkg) => codeFiles.map((file) => `${pkg}/${file}`);

const fromPackage = (...packages) => packages.map((pkg) => [`@${pkg}/*`, `**/${pkg}/src/*`]).flat();

export const noRestrictedImports = [
  /**
   * Inter-package dependency rules:
   *
   * - `domains` may only import types from `db`. Nothing else from `db`.
   * - `infrastructure` may import from `db` and `domains`, but not from `web` or `mobile`.
   * - `web` may import from `domains`, `infrastructure`, and `db`.
   * - `mobile` may only import from `web` for API response types (`mobile` should never hit the database directly).
   * - `db` may not import from `web`, `mobile`, or `infrastructure`.
   * - `utils` may not import any other packages.
   */
  {
    files: packageFiles('db'),
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: fromPackage('web', 'mobile', 'infrastructure'),
              message: 'The db package must not import from web, mobile, or infrastructure.',
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
              group: fromPackage('web', 'mobile'),
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
              group: fromPackage('web', 'mobile', 'infrastructure'),
              message: 'The domain package must not import from web, mobile, or infrastructure.',
            },
            {
              group: fromPackage('db'),
              allowTypeImports: true,
              message: 'The domain package may only import types from the db package.',
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
              group: fromPackage('db', 'domains', 'infrastructure', 'web'),
              message: 'The mobile package must not import from db, domains, infrastructure, or web.',
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
