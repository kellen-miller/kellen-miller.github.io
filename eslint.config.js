import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  {
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.astro'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    files: ['**/*.astro/*.js', '**/*.astro/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts'],
  },
];
