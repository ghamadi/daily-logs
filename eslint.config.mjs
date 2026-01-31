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
];

export default eslintConfig;
