import type { ESLint, Rule } from 'eslint';

import { noNetworkOutsideApi } from './no-network-outside-api';
import { noSheetsOutsideAdapter } from './no-sheets-outside-adapter';

export const rules: Record<string, Rule.RuleModule> = {
  'no-sheets-outside-adapter': noSheetsOutsideAdapter,
  'no-network-outside-api': noNetworkOutsideApi,
};

/**
 * ESLint plugin bundling the two architectural-boundary rules. Consumed by the
 * shared config (`@wise-bloom/config/eslint`) and wired into CI so a boundary
 * violation fails the build (docs/20-Implementation/205 §8, Task 2).
 */
export const boundaryPlugin: ESLint.Plugin = {
  meta: { name: '@wise-bloom/lint-rules', version: '0.0.0' },
  rules,
};

export { noNetworkOutsideApi, noSheetsOutsideAdapter };

export default boundaryPlugin;
