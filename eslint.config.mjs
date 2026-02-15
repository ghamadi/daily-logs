import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import parser from '@typescript-eslint/parser';

const eslintConfig = [
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
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
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    ignores: ['db/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@db/utils',
              message: 'Do not import db/utils outside the db package.',
            },
            {
              name: '@daily-logs/db/utils',
              message: 'Do not import db/utils outside the db package.',
            },
          ],
          patterns: [
            {
              group: ['**/db/src/utils', '**/db/src/utils.ts'],
              message: 'Do not import db/utils outside the db package.',
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
