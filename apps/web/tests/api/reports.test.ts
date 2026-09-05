/**
 * Reports API module tests (docs/04-Architecture/56 §5,§7 `/v1/reports`).
 */

import { describe, expect, it, vi } from 'vitest';

import { getReportMedia, listReports, uploadReport } from '../../src/api/reports';
import { ApiClient } from '../../src/api/client';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function client(fetchImpl: typeof fetch): ApiClient {
  return new ApiClient({ baseUrl: 'https://x.test', token: 't', fetchImpl });
}

describe('reports api', () => {
  it('uploads a report via POST', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ event: { event_id: 'e1' }, report: { report_id: 'r1' } }),
    );
    const result = await uploadReport(client(fetchImpl as unknown as typeof fetch), {
      subject_id: 'm1',
      kind: 'ultrasound',
      media_upload_ref: 'upload:scan.png',
    });
    expect(result.report.report_id).toBe('r1');
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/reports');
    expect(init.method).toBe('POST');
  });

  it('lists reports', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    const result = await listReports(client(fetchImpl as unknown as typeof fetch));
    expect(result.items).toEqual([]);
  });

  it('mints a short-lived media ref via the report_id query param', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ report_id: 'r1', media_ref: '123.media:x.sig', expires_at: 'z' }),
    );
    await getReportMedia(client(fetchImpl as unknown as typeof fetch), 'r1');
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(new URL(url).searchParams.get('path')).toBe('/v1/reports/media');
    expect(url).toContain('report_id=r1');
  });
});
