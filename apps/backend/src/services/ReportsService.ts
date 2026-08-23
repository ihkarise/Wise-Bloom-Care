/**
 * ReportsService — stores lab/ultrasound report metadata and serves media only
 * through short-lived, backend-mediated references (docs/06-Modules/84,
 * docs/20-Implementation/207 Task 4).
 *
 * Privacy is the keystone: the stored `media_ref` is a private opaque id, never
 * a public URL, and viewing requires a freshly minted reference that expires
 * (docs/04-Architecture/58, 84 BR-1). Every upload also appends a `report`
 * timeline event for continuity (84 BR-5).
 */

import { newId } from '../lib/ids';
import { isPublicUrl, type MediaService, type MintedMediaRef } from '../lib/media';
import { isIsoDateTime, isNotFuture, sanitizeString, ValidationError } from '../lib/validation';

import type { TimelineService } from './TimelineService';
import type { StorageAdapter } from '../adapters/StorageAdapter';
import type { Event, ISODateTime, LifeStage, Report, UUID } from '@wise-bloom/domain-types';

export class ReportNotFoundError extends Error {
  override readonly name = 'ReportNotFoundError';
}

export interface UploadReportInput {
  familyId: UUID;
  subjectId: UUID;
  createdBy: UUID;
  kind: string;
  /** Opaque client upload handle — resolved to a private media_ref; must not be a public URL. */
  mediaUploadRef: string;
  uploadedAt?: ISODateTime;
  lifeStage?: LifeStage;
}

export interface UploadReportResult {
  event: Event;
  report: Report;
}

export class ReportsService {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly timeline: TimelineService,
    private readonly media: MediaService,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  /** Uploads a report: private media_ref + metadata + a `report` timeline event. */
  uploadReport(input: UploadReportInput): UploadReportResult {
    const kind = sanitizeString((input.kind ?? '').trim());
    if (!kind) {
      throw new ValidationError('kind is required');
    }
    if (!input.mediaUploadRef || !input.mediaUploadRef.trim()) {
      throw new ValidationError('media_upload_ref is required');
    }
    const uploadedAt = input.uploadedAt ?? this.now();
    if (!isIsoDateTime(uploadedAt)) {
      throw new ValidationError('uploaded_at must be an ISO 8601 UTC datetime');
    }
    if (!isNotFuture(uploadedAt)) {
      throw new ValidationError('uploaded_at cannot be in the future');
    }

    // Never store anything that could become a durable public link (84 BR-1).
    const mediaRef = this.media.storeUpload(input.mediaUploadRef);
    if (isPublicUrl(mediaRef)) {
      throw new ValidationError('Refusing to store a public media reference');
    }

    const report: Report = {
      report_id: newId(),
      subject_id: input.subjectId,
      kind,
      media_ref: mediaRef,
      uploaded_at: uploadedAt,
    };
    const created = this.storage.create('Report', report);

    const event = this.timeline.append({
      familyId: input.familyId,
      subjectId: input.subjectId,
      type: 'report',
      lifeStage: input.lifeStage ?? 'pregnancy',
      occurredAt: uploadedAt,
      createdBy: input.createdBy,
    });

    return { event, report: created };
  }

  /** Report metadata for a subject, newest first. Media is never included here. */
  listReports(subjectId: UUID): Report[] {
    return this.storage
      .query('Report', { subject_id: subjectId })
      .sort((a, b) => Date.parse(b.uploaded_at) - Date.parse(a.uploaded_at));
  }

  getReport(reportId: UUID): Report {
    const report = this.storage.get('Report', reportId);
    if (!report) {
      throw new ReportNotFoundError(`Report ${reportId} not found`);
    }
    return report;
  }

  /**
   * Mints a short-lived, backend-mediated reference to a report's private
   * media (docs/04-Architecture/58). The returned reference expires; there is
   * no durable public link.
   */
  mintMediaRef(reportId: UUID): MintedMediaRef {
    const report = this.getReport(reportId);
    return this.media.issueViewRef(report.media_ref);
  }
}
