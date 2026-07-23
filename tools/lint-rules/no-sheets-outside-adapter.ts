import type { Rule } from 'eslint';

/**
 * Enforces docs/04-Architecture/53 BR-1 / 59 BR-1: only the Sheets storage
 * adapter may touch `SpreadsheetApp`. Every other module must go through the
 * storage-neutral StorageAdapter interface so the storage engine stays
 * swappable (NFR-6). The boundary is code, not convention.
 */
const ADAPTER_DIR = 'apps/backend/src/adapters/sheets';

function toPosix(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export const noSheetsOutsideAdapter: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow references to SpreadsheetApp outside the Sheets storage adapter (docs/04-Architecture/53 BR-1).',
      recommended: true,
    },
    schema: [],
    messages: {
      forbidden:
        'SpreadsheetApp may only be used inside apps/backend/src/adapters/sheets (docs/04-Architecture/53 BR-1). Route persistence through the StorageAdapter interface.',
    },
  },
  create(context) {
    const filename = toPosix(context.filename);
    if (filename.includes(ADAPTER_DIR)) {
      return {};
    }
    return {
      Identifier(node) {
        if (node.name === 'SpreadsheetApp') {
          context.report({ node, messageId: 'forbidden' });
        }
      },
    };
  },
};

export default noSheetsOutsideAdapter;
