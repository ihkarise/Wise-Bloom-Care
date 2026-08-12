/**
 * ReportsService tests (docs/20-Implementation/207 §9 unit: report metadata +
 * media ref; §8: media served only via short-lived backend-mediated refs;
 * §84 BR-5: a report creates a timeline event).
 */

import { describe, expect, it } from 'vitest';

import { isPublicUrl, MediaService } from '../../src/lib/media';
import { ValidationError } from '../../src/lib/validation';
import { FamilyService } from '../../src/services/FamilyService';
import { ReportNotFoundError, ReportsService } from '../../src/services/ReportsService';
import { TimelineService } from '../../src/services/TimelineService';
import { createInMemoryAdapter } from '../support/inMemoryAdapter';

function setup() {
  const storage = createInMemoryAdapter();
  const family = new FamilyService(storage).createFamily('user-1');
  const timeline = new TimelineService(storage);
  const reports = new ReportsService(storage, timeline, new MediaService('secret'));
  return { storage, family, timeline, reports };
}

const base = { familyId: '', subjectId: 'maternal-1', createdBy: 'user-1' };

describe('ReportsService.uploadReport', () => {
  it('stores metadata with a private media_ref and appends a report timeline event', () => {
    const { storage, family, timeline, reports } = setup();
    const result = reports.uploadReport({
      ...base,
      familyId: family.family_id,
      kind: 'ultrasound',
      mediaUploadRef: 'upload-handle-1',
      uploadedAt: '2026-03-01T10:00:00.000Z',
    });

    expect(result.report.kind).toBe('ultrasound');
    expect(isPublicUrl(result.report.media_ref)).toBe(false);
    expect(result.report.media_ref.startsWith('media:')).toBe(true);
    expect(storage.get('Report', result.report.report_id)).not.toBeNull();

    expect(result.event.type).toBe('report');
    expect(timeline.list(family.family_id).items).toHaveLength(1);
  });

  it('requires a kind and a media_upload_ref', () => {
    const { family, reports } = setup();
    expect(() =>
      reports.uploadReport({ ...base, familyId: family.family_id, kind: '', mediaUploadRef: 'x' }),
    ).toThrow(ValidationError);
    expect(() =>
      reports.uploadReport({
        ...base,
        familyId: family.family_id,
        kind: 'lab',
        mediaUploadRef: '',
      }),
    ).toThrow(ValidationError);
  });

  it('neutralises a formula-injection attempt in the kind string', () => {
    const { family, reports } = setup();
    const result = reports.uploadReport({
      ...base,
      familyId: family.family_id,
      kind: '=cmd()',
      mediaUploadRef: 'handle',
    });
    expect(result.report.kind.startsWith("'")).toBe(true);
  });
});

describe('ReportsService.mintMediaRef', () => {
  it('mints a short-lived reference for a stored report', () => {
    const { family, reports } = setup();
    const created = reports.uploadReport({
      ...base,
      familyId: family.family_id,
      kind: 'lab',
      mediaUploadRef: 'handle',
    });
    const minted = reports.mintMediaRef(created.report.report_id);
    expect(minted.media_ref.length).toBeGreaterThan(0);
    expect(isPublicUrl(minted.media_ref)).toBe(false);
    expect(new Date(minted.expires_at).getTime()).toBeGreaterThan(Date.now());
  });

  it('throws for an unknown report id', () => {
    const { reports } = setup();
    expect(() => reports.mintMediaRef('missing')).toThrow(ReportNotFoundError);
  });
});
