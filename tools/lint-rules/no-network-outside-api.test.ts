import { RuleTester } from 'eslint';
import { afterAll, describe, it } from 'vitest';

import { noNetworkOutsideApi } from './no-network-outside-api';

// Wire RuleTester's lifecycle hooks to Vitest so its cases register as tests.
const hooks = RuleTester as unknown as {
  afterAll: typeof afterAll;
  describe: typeof describe;
  it: typeof it;
  itOnly: typeof it.only;
};
hooks.afterAll = afterAll;
hooks.describe = describe;
hooks.it = it;
hooks.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run('no-network-outside-api', noNetworkOutsideApi, {
  valid: [
    {
      name: 'fetch allowed inside the api client',
      filename: 'apps/web/src/api/client.ts',
      code: 'await fetch("/v1/timeline");',
    },
    {
      name: 'no network in a feature component is fine',
      filename: 'apps/web/src/features/vitals/VitalsCard.tsx',
      code: 'const label = format(value);',
    },
    {
      name: 'files outside the web app are not this boundary',
      filename: 'apps/backend/src/services/AuditService.ts',
      code: 'const r = fetch;',
    },
  ],
  invalid: [
    {
      name: 'planted fetch in a feature fails the build',
      filename: 'apps/web/src/features/vitals/VitalsCard.tsx',
      code: 'await fetch("/v1/vitals");',
      errors: [{ messageId: 'forbidden' }],
    },
    {
      name: 'planted XMLHttpRequest in an island fails the build',
      filename: 'apps/web/src/islands/Dashboard.tsx',
      code: 'const xhr = new XMLHttpRequest();',
      errors: [{ messageId: 'forbidden' }],
    },
  ],
});
