import js from '@eslint/js';
import { boundaryPlugin } from '@wise-bloom/lint-rules';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import type { Linter } from 'eslint';

/**
 * Shared flat ESLint config for the whole monorepo (docs/11-Development/140 §8).
 * It layers: JS recommended → typescript-eslint recommended → the two
 * architectural-boundary rules (docs/04-Architecture/51 BR-1, 53 BR-1) → a
 * Prettier compatibility layer that disables stylistic rules.
 */
export const baseEslintConfig: Linter.Config[] = tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/.astro/**',
      '**/coverage/**',
      '**/*.astro',
      '**/env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mts,cts,js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    plugins: {
      boundaries: boundaryPlugin,
    },
    rules: {
      'boundaries/no-sheets-outside-adapter': 'error',
      'boundaries/no-network-outside-api': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  prettier,
) as Linter.Config[];

export default baseEslintConfig;
