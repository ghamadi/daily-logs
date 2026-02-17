import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import parser from '@typescript-eslint/parser';

const codeFiles = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
const packageFiles = (pkg) => codeFiles.map((file) => `${pkg}/${file}`);

const fromSrcFolderOf = (...packages) => packages.map((pkg) => [`@${pkg}/*`, `**/${pkg}/src/*`]).flat();

const fromExportsFolderOf = (...packages) =>
  packages.map((pkg) => [`@${pkg}-exports/*`, `**/${pkg}/exports/*`]).flat();

export const noRestrictedImports = [
  /**
   * Inter-package dependency rules:
   *
   * - `domains` may only import types and enums from `db`. Nothing else from `db` and no other packages.
   * - `web` may import from `domains` and `db` (for repository implementations).
   * - `mobile` may only import from `web` for API response types (`mobile` should never hit the database directly).
   * - `db` may not import any other packages.
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
              group: fromExportsFolderOf('web', 'mobile', 'domains'),
              message: 'The db package must not import from web, mobile, or domain.',
            },
            {
              group: fromSrcFolderOf('web', 'mobile', 'domains', 'utils'),
              message:
                "You can only import from the 'exports' folder of a package. Import from '@<pkg>-exports/*'.",
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
              group: fromExportsFolderOf('web', 'mobile'),
              message: 'The domain package must not import from web or mobile.',
            },
            {
              group: [...fromExportsFolderOf('db'), '!@db-exports/enums'],
              allowTypeImports: true,
              message: 'The domain package may only import types and enums from the db package.',
            },
            {
              group: fromSrcFolderOf('web', 'mobile', 'db', 'utils'),
              message:
                "You can only import from the 'exports' folder of a package. Import from '@<pkg>-exports/*'.",
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
              group: fromExportsFolderOf('db', 'domains'),
              message: 'The mobile package must not import from db or domain.',
            },
            {
              group: fromSrcFolderOf('db', 'domains', 'web', 'utils'),
              message:
                "You can only import from the 'exports' folder of a package. Import from '@<pkg>-exports/*'.",
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
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
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
