/**
 * Reports API calls (docs/04-Architecture/56 §5,§7 `/v1/reports`,
 * docs/06-Modules/84). Media is never a public link — it is fetched as a
 * short-lived, backend-mediated reference via `getReportMedia` (58, 84 BR-1).
 */

import type { FamilyScope } from './family';
import type { ApiClient } from './client';
import type {
  CreateReportRequest,
  CreateReportResponse,
  ReportListResponse,
  ReportMediaResponse,
} from '@wise-bloom/api-contract';

export function uploadReport(
  client: ApiClient,
  input: CreateReportRequest,
  scope: FamilyScope = {},
): Promise<CreateReportResponse> {
  return client.request<CreateReportResponse>('/reports', {
    method: 'POST',
    body: input,
    query: { family_id: scope.familyId },
  });
}

export function listReports(
  client: ApiClient,
  scope: FamilyScope = {},
): Promise<ReportListResponse> {
  return client.request<ReportListResponse>('/reports', {
    method: 'GET',
    query: { family_id: scope.familyId },
  });
}

/** Mints a short-lived, backend-mediated reference to a report's private media. */
export function getReportMedia(
  client: ApiClient,
  reportId: string,
  scope: FamilyScope = {},
): Promise<ReportMediaResponse> {
  return client.request<ReportMediaResponse>('/reports/media', {
    method: 'GET',
    query: { family_id: scope.familyId, report_id: reportId },
  });
}
