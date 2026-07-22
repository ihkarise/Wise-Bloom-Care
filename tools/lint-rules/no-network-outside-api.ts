import type { Rule } from 'eslint';

/**
 * Enforces docs/04-Architecture/51 BR-1: the web app talks to the backend from
 * exactly one place — `apps/web/src/api` (the typed client). No component,
 * island, feature, or lib issues its own network call. This keeps the API
 * contract the single boundary the client depends on.
 */
const WEB_SRC = 'apps/web/src';
const API_DIR = 'apps/web/src/api';

const NETWORK_GLOBALS = new Set([
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'UrlFetchApp',
]);

function toPosix(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export const noNetworkOutsideApi: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow direct network access outside the web app API client, apps/web/src/api (docs/04-Architecture/51 BR-1).',
      recommended: true,
    },
    schema: [],
    messages: {
      forbidden:
        'Network access ("{{name}}") is only allowed in apps/web/src/api (docs/04-Architecture/51 BR-1). Use the typed API client.',
    },
  },
  create(context) {
    const filename = toPosix(context.filename);
    const inWeb = filename.includes(WEB_SRC);
    const inApiClient = filename.includes(API_DIR);
    if (!inWeb || inApiClient) {
      return {};
    }

    return {
      CallExpression(node) {
        const { callee } = node;
        if (callee.type === 'Identifier' && NETWORK_GLOBALS.has(callee.name)) {
          context.report({ node: callee, messageId: 'forbidden', data: { name: callee.name } });
          return;
        }
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'sendBeacon'
        ) {
          context.report({
            node: callee.property,
            messageId: 'forbidden',
            data: { name: 'navigator.sendBeacon' },
          });
        }
      },
      NewExpression(node) {
        const { callee } = node;
        if (callee.type === 'Identifier' && NETWORK_GLOBALS.has(callee.name)) {
          context.report({ node: callee, messageId: 'forbidden', data: { name: callee.name } });
        }
      },
    };
  },
};

export default noNetworkOutsideApi;
