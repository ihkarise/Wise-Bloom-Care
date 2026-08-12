/**
 * Reports controller — upload report metadata, list it, and mint short-lived
 * media references (docs/04-Architecture/56 §5,§7 `/v1/reports`,
 * docs/06-Modules/84). Family-scoped and audited; media is served ONLY through
 * expiring, backend-mediated references — never a public link (58, 84 BR-1/BR-2).
 */

import { ValidationError } from '../lib/validation';
import { assertMaternalSubject, requireFamilyMaternal, resolveScopedFamily } from './rbac';
import { asRecord, asString, queryParam } from './requestHelpers';
import { ApiException, requireActor, type RouteHandler } from './router';

import type { AuditService } from '../services/AuditService';
import type { FamilyService } from '../services/FamilyService';
import type { MaternalService } from '../services/MaternalService';
import { ReportNotFoundError, type ReportsService } from '../services/ReportsService';
import type {
  CreateReportResponse,
  ReportListResponse,
  ReportMediaResponse,
} from '@wise-bloom/api-contract';

export interface ReportsControllerDeps {
  family: FamilyService;
  maternal: MaternalService;
  reports: ReportsService;
  audit: AuditService;
}

export function createReportsController(deps: ReportsControllerDeps): Record<string, RouteHandler> {
  return {
    'POST /v1/reports': (request, actor): { status: number; body: CreateReportResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const body = asRecord(request.body);
      assertMaternalSubject(maternal, asString(body['subject_id'], 'subject_id'));

      let result;
      try {
        result = deps.reports.uploadReport({
          familyId: family.family_id,
          subjectId: maternal.maternal_id,
          createdBy: me.userId,
          kind: asString(body['kind'], 'kind'),
          mediaUploadRef: asString(body['media_upload_ref'], 'media_upload_ref'),
          ...(typeof body['uploaded_at'] === 'string' ? { uploadedAt: body['uploaded_at'] } : {}),
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ApiException('validation_failed', 422, error.message);
        }
        throw error;
      }

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'create',
        entity: 'Report',
        entityId: result.report.report_id,
        familyId: family.family_id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 201, body: { event: result.event, report: result.report } };
    },

    'GET /v1/reports': (request, actor): { status: number; body: ReportListResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const items = deps.reports.listReports(maternal.maternal_id);

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'read',
        entity: 'Report',
        entityId: maternal.maternal_id,
        familyId: family.family_id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return { status: 200, body: { items } };
    },

    'GET /v1/reports/media': (request, actor): { status: number; body: ReportMediaResponse } => {
      const me = requireActor(actor);
      const family = resolveScopedFamily(deps.family, me, queryParam(request, 'family_id'));
      const maternal = requireFamilyMaternal(deps.maternal, family.family_id);
      const reportId = asString(queryParam(request, 'report_id'), 'report_id');

      let report;
      try {
        report = deps.reports.getReport(reportId);
      } catch (error) {
        if (error instanceof ReportNotFoundError) {
          throw new ApiException('not_found', 404, 'Report not found');
        }
        throw error;
      }
      // Family-scope the media: the report's subject must be this family's maternal record.
      assertMaternalSubject(maternal, report.subject_id);

      const minted = deps.reports.mintMediaRef(reportId);

      deps.audit.record({
        actorUserId: me.userId,
        actorRole: me.role,
        action: 'read',
        entity: 'Report',
        entityId: reportId,
        familyId: family.family_id,
        meta: { media_ref: true },
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      });

      return {
        status: 200,
        body: { report_id: reportId, media_ref: minted.media_ref, expires_at: minted.expires_at },
      };
    },
  };
}
