/**
 * Shared integration-test harness: a full `buildApp` wiring over an
 * in-memory adapter, so integration tests drive the real HTTP-shaped request
 * pipeline (auth guard → controllers → services → adapter) exactly as
 * production does, only swapping the Sheets gateway for an in-memory one
 * (docs/20-Implementation/206 §9 integration tests).
 */

import { buildApp, type App } from '../../src/app';
import { createLogger } from '../../src/lib/logging';
import { createInMemoryAdapter } from './inMemoryAdapter';

import type { SheetsStorageAdapter } from '../../src/adapters/sheets/SheetsStorageAdapter';

export const TEST_EMAIL_PEPPER = 'integration-test-pepper';

export interface TestApp extends App {
  /** The exact adapter instance backing the app — lets tests assert on persisted rows (e.g., audit records). */
  storage: SheetsStorageAdapter;
}

export function buildTestApp(): TestApp {
  const storage = createInMemoryAdapter();
  const app = buildApp({
    storage,
    logger: createLogger({ sink: () => undefined }),
    emailPepper: TEST_EMAIL_PEPPER,
  });
  return { ...app, storage };
}
