/**
 * Apps Script web-app entrypoint (docs/04-Architecture/53 §4).
 *
 * `doGet`/`doPost` are the GAS HTTP entry points. They adapt the runtime event
 * to a storage-neutral `ApiRequest`, run it through `buildApp`'s controller
 * pipeline (`app.ts`), and return JSON. All storage goes through the
 * `StorageAdapter` interface — this file never references `SpreadsheetApp`
 * (that lives only in the sheets adapter). Config/secrets come from Script
 * Properties, never code (53 §4, docs/09-Security/124).
 *
 * Note: GAS's own global `ContentService.createTextOutput` (used in `respond`
 * below) is an unrelated Apps Script platform API — distinct from this
 * project's domain `ContentService` (content typing, `src/services/`), which
 * this file deliberately never imports, to keep that name unambiguous here.
 */

import {
  SheetsStorageAdapter,
  SpreadsheetAppGateway,
} from './adapters/sheets/SheetsStorageAdapter';
import { buildApp } from './app';
import { createLogger } from './lib/logging';

import type { ApiRequest, ApiResponse } from './controllers/router';
import type { HttpMethod } from '@wise-bloom/api-contract';

/** Query/body keys that carry request plumbing rather than endpoint parameters. */
const RESERVED_PARAMS = new Set(['path', 'token', 'correlationId', 'idempotencyKey']);

function config(key: string): string | null {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function requireConfig(key: string): string {
  const value = config(key);
  if (!value) {
    throw new Error(`Missing required Script Property: ${key}`);
  }
  return value;
}

function buildHandler(): (request: ApiRequest) => ApiResponse {
  const logger = createLogger({
    debugEnabled: config('ENVIRONMENT') === 'dev',
    sink: (entry) => console.log(JSON.stringify(entry)),
  });

  const storage = new SheetsStorageAdapter(
    new SpreadsheetAppGateway(requireConfig('SPREADSHEET_ID')),
  );
  const emailPepper = requireConfig('EMAIL_PEPPER');

  return buildApp({ storage, logger, emailPepper }).handle;
}

/** Exported for entry-point translation tests (apps/backend/tests/main.test.ts). */
export function toApiRequest(
  method: HttpMethod,
  event: GoogleAppsScript.Events.DoGet | GoogleAppsScript.Events.DoPost,
): ApiRequest {
  const params = event.parameter ?? {};
  const post = (event as GoogleAppsScript.Events.DoPost).postData;
  const request: ApiRequest = {
    method,
    path: params['path'] ?? '/',
  };
  if (params['token']) request.token = params['token'];
  if (params['correlationId']) request.correlationId = params['correlationId'];
  if (params['idempotencyKey']) request.idempotencyKey = params['idempotencyKey'];
  if (post?.contents) request.body = JSON.parse(post.contents);

  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (!RESERVED_PARAMS.has(key)) {
      query[key] = value;
    }
  }
  if (Object.keys(query).length > 0) {
    request.query = query;
  }

  return request;
}

function respond(response: ApiResponse): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput(JSON.stringify(response.body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

export function doGet(event: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
  return respond(buildHandler()(toApiRequest('GET', event)));
}

export function doPost(event: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  return respond(buildHandler()(toApiRequest('POST', event)));
}
