/**
 * Bundle the Apps Script backend into a single, GAS-deployable file.
 *
 * WHY THIS EXISTS (docs/04-Architecture/53 §4): the backend is written as a
 * modular ES-module TypeScript app (main.ts + controllers/services/adapters +
 * the `@wise-bloom/*` workspace packages) so it can be unit-tested. Google Apps
 * Script has NO module system — every file shares one flat global scope, there
 * is no `import`/`export`, and it cannot resolve npm/workspace packages. clasp
 * also does not transpile/bundle: pushing `src/` sent only `appsscript.json`
 * (clasp v3 skips `.ts`), so the deployed project had no `doGet`/`doPost` and
 * the Web App failed with "Script function not found: doGet".
 *
 * esbuild bundles the whole module graph into one IIFE assigned to a global
 * (`WBGAS`); the footer then re-exposes the two GAS entry points as top-level
 * global functions delegating to it, which is the name GAS actually invokes.
 * Ambient GAS globals (ContentService, PropertiesService, SpreadsheetApp, …)
 * are not imported, so esbuild leaves them as free references the GAS runtime
 * satisfies. The domain logic is unchanged — this only makes the existing
 * `doGet`/`doPost` reachable.
 */
import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..'); // apps/backend
const outDir = resolve(root, 'gas-dist');
const outFile = resolve(outDir, 'main.js');

mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [resolve(root, 'src/main.ts')],
  bundle: true,
  format: 'iife',
  globalName: 'WBGAS',
  // GAS runs the V8 runtime; es2019 keeps the output well within its support.
  target: 'es2019',
  // Neutral platform: no Node/browser shims, and the workspace packages resolve
  // via their unconditional `exports` entry (their TypeScript source).
  platform: 'neutral',
  legalComments: 'none',
  charset: 'utf8',
  outfile: outFile,
  footer: {
    js:
      '\n// Apps Script invokes entry points by GLOBAL name (docs/04-Architecture/53 §4).\n' +
      'function doGet(e) { return WBGAS.doGet(e); }\n' +
      'function doPost(e) { return WBGAS.doPost(e); }\n',
  },
});

// The manifest must sit alongside the code in the pushed rootDir.
copyFileSync(resolve(root, 'src/appsscript.json'), resolve(outDir, 'appsscript.json'));

console.log('GAS bundle written:', outFile);
