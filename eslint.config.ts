import { baseEslintConfig } from '@wise-bloom/config/eslint';

import type { Linter } from 'eslint';

/**
 * Root ESLint flat config. Loaded by ESLint (via jiti) for the whole repo and
 * by every package's `lint` script. The real configuration lives in the shared
 * `@wise-bloom/config` package so both apps and packages lint identically.
 */
const config: Linter.Config[] = [
  {
    // `e2e/` is a standalone Playwright project outside the pnpm workspace; it
    // installs its own deps in CI and is linted/typechecked by Playwright itself.
    ignores: ['docs/**', 'knowledge-base/**', 'e2e/**'],
  },
  ...baseEslintConfig,
];

export default config;
