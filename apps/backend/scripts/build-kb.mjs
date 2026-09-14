/**
 * Generate the bundled week-by-week pregnancy knowledge catalogue from the
 * knowledge base (MS-1.6, docs/06-Modules/82 FR-4, docs/07-AI/101).
 *
 * WHY THIS EXISTS: the authored week content is the source of truth and lives in
 * `knowledge-base/pregnancy/week01..40.md` (docs/07-AI/101 §2/§3, BR-2 "KB is
 * code-independent and versioned independently"). The backend runs on Google
 * Apps Script, which has no filesystem access at runtime, so the content must be
 * bundled into the deployed artifact (esbuild inlines this JSON — see
 * build-gas.mjs). This script parses each week file's front-matter
 * (`content_type` + `source_ref`, required for typed+sourced serving,
 * docs/02-Research/28 BR-1) and body into a small JSON catalogue the backend
 * imports. No content is authored or altered here — it is copied verbatim; a
 * drift test (tests/content/pregnancy-weeks.test.ts) fails if this output ever
 * diverges from the KB.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(here, '..'); // apps/backend
const repoRoot = resolve(backendRoot, '../..');
const kbDir = resolve(repoRoot, 'knowledge-base/pregnancy');

const MIN_WEEK = 1;
const MAX_WEEK = 40;

/** Parse one KB markdown file into a catalogue entry. Pure text handling — no content is invented. */
export function parseWeekFile(week, text, kbPath) {
  const fm = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fm) {
    throw new Error(`${kbPath}: missing front-matter`);
  }
  const front = fm[1];
  const rest = fm[2];

  const readKey = (key) => {
    const m = front.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : undefined;
  };

  const contentType = readKey('content_type');
  const lifeStage = readKey('life_stage');
  const version = readKey('version');
  const rawSource = readKey('source_ref');
  if (!contentType || !lifeStage || !version || !rawSource) {
    throw new Error(`${kbPath}: front-matter missing content_type/source_ref/life_stage/version`);
  }

  // `source_ref: [a, b, c]` (an inline YAML list of source keys) → a single
  // non-empty string, as ContentItem.source_ref is a string (docs/05-Data/72 §9).
  const sourceRef = rawSource
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');

  const titleMatch = rest.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : `Pregnancy — Week ${week}`;
  // Body is the authored content after the front-matter, with the single leading
  // H1 title line removed (the title is surfaced separately). Copied verbatim.
  const body = rest.replace(/^#\s+.+$/m, '').trim();

  return {
    week,
    topic: `pregnancy-week-${week}`,
    content_type: contentType,
    source_ref: sourceRef,
    life_stage: lifeStage,
    version,
    kb_path: `knowledge-base/pregnancy/week${String(week).padStart(2, '0')}.md`,
    title,
    body,
  };
}

function generate() {
  const entries = [];
  for (let week = MIN_WEEK; week <= MAX_WEEK; week += 1) {
    const fileName = `week${String(week).padStart(2, '0')}.md`;
    const kbPath = `knowledge-base/pregnancy/${fileName}`;
    const text = readFileSync(resolve(kbDir, fileName), 'utf8');
    entries.push(parseWeekFile(week, text, kbPath));
  }

  const outDir = resolve(backendRoot, 'src/content');
  const outFile = resolve(outDir, 'pregnancy-weeks.generated.json');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
  console.log(`KB catalogue written: ${outFile} (${entries.length} weeks)`);
}

// Run when invoked directly (not when imported by the drift test).
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generate();
}
