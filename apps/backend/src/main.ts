/**
 * Apps Script web-app entrypoint (docs/04-Architecture/53 §4).
 *
 * `doGet`/`doPost` are the GAS HTTP entry points. They adapt the runtime event
 * to a storage-neutral `ApiRequest`, run it through the controller pipeline, and
 * return JSON. All storage goes through the `StorageAdapter` interface — this
 * file never references `SpreadsheetApp` (that lives only in the sheets adapter).
 * Config/secrets come from Script Properties, never code (53 §4, docs/09-Security/124).
 */

import {
  SheetsStorageAdapter,
  SpreadsheetAppGateway,
} from './adapters/sheets/SheetsStorageAdapter';
import { createRouter, type ApiRequest, type ApiResponse } from './controllers/router';
import { createLogger } from './lib/logging';

import type { HttpMethod } from '@wise-bloom/api-contract';

function config(key: string): string | null {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function buildHandler(): (request: ApiRequest) => ApiResponse {
  const logger = createLogger({
    debugEnabled: config('ENVIRONMENT') === 'dev',
    sink: (entry) => console.log(JSON.stringify(entry)),
  });

  const spreadsheetId = config('SPREADSHEET_ID');
  if (spreadsheetId) {
    // Constructing the adapter proves the storage boundary is wired end to end.
    // Concurrency-sensitive writes are guarded with LockService at call sites in
    // later sprints (docs/04-Architecture/53 §7).
    void new SheetsStorageAdapter(new SpreadsheetAppGateway(spreadsheetId));
  }

  return createRouter({ logger });
}

function toApiRequest(
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
