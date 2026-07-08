import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export function createESLintConfig() {
  return tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettierConfig,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
        },
      },
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
    {
      ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/coverage/**'],
    },
  );
}
