import { RuleTester } from 'eslint';
import { afterAll, describe, it } from 'vitest';

import { noSheetsOutsideAdapter } from './no-sheets-outside-adapter';

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

ruleTester.run('no-sheets-outside-adapter', noSheetsOutsideAdapter, {
  valid: [
    {
      name: 'SpreadsheetApp allowed inside the sheets adapter',
      filename: 'apps/backend/src/adapters/sheets/SheetsStorageAdapter.ts',
      code: 'const sheet = SpreadsheetApp.openById("dev");',
    },
    {
      name: 'unrelated code outside the adapter is fine',
      filename: 'apps/backend/src/services/AuditService.ts',
      code: 'const x = someHelper();',
    },
  ],
  invalid: [
    {
      name: 'planted SpreadsheetApp use in a service fails the build',
      filename: 'apps/backend/src/services/AuditService.ts',
      code: 'const sheet = SpreadsheetApp.openById("prod");',
      errors: [{ messageId: 'forbidden' }],
    },
    {
      name: 'planted SpreadsheetApp use in a lib helper fails the build',
      filename: 'apps/backend/src/lib/ids.ts',
      code: 'export function bad() { return SpreadsheetApp.getActive(); }',
      errors: [{ messageId: 'forbidden' }],
    },
  ],
});
