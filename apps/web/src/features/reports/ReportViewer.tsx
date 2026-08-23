/**
 * ReportViewer — lists a family's report metadata and fetches media only via a
 * short-lived, backend-mediated reference (docs/06-Modules/84 FR-2, BR-1;
 * docs/04-Architecture/58). It never renders or holds a public link: viewing
 * mints a fresh reference that expires. Given `client` + a `reloadToken` so a
 * new upload refreshes the list.
 */
import { useCallback, useEffect, useState, type ReactElement } from 'react';

import { getReportMedia, listReports } from '../../api/reports';
import { friendlyErrorMessage } from '../../lib/errors';

import type { ApiClient } from '../../api/client';
import type { ReportMediaResponse } from '@wise-bloom/api-contract';
import type { Report } from '@wise-bloom/domain-types';

export interface ReportViewerProps {
  client: ApiClient | null;
  /** Bump to force a reload after a new upload. */
  reloadToken?: number;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function ReportViewer({ client, reloadToken }: ReportViewerProps): ReactElement {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openRef, setOpenRef] = useState<ReportMediaResponse | null>(null);

  const load = useCallback(() => {
    if (!client) {
      return;
    }
    setError(null);
    listReports(client)
      .then((page) => setReports(page.items))
      .catch((caught: unknown) => setError(friendlyErrorMessage(caught)));
  }, [client]);

  useEffect(() => {
    load();
  }, [load, reloadToken]);

  async function handleView(reportId: string): Promise<void> {
    if (!client) {
      return;
    }
    setError(null);
    try {
      setOpenRef(await getReportMedia(client, reportId));
    } catch (caught) {
      setError(friendlyErrorMessage(caught));
    }
  }

  return (
    <section aria-labelledby="reports-list-heading" className="flex flex-col gap-3">
      <h3 id="reports-list-heading" className="text-body font-semibold text-text-primary">
        Your reports
      </h3>

      {error ? (
        <p role="alert" className="text-small text-caution">
          {error}
        </p>
      ) : null}

      {reports.length === 0 ? (
        <p className="text-body text-text-secondary">No reports uploaded yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reports.map((report) => (
            <li
              key={report.report_id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-raised p-3"
            >
              <div>
                <p className="text-body font-medium text-text-primary">{report.kind}</p>
                <p className="text-small text-text-secondary">{formatDate(report.uploaded_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleView(report.report_id)}
                className="rounded-md border border-border px-3 py-1.5 text-small font-medium text-text-primary hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Get secure link
              </button>
            </li>
          ))}
        </ul>
      )}

      {openRef ? (
        <div
          aria-live="polite"
          className="rounded-md border border-border bg-surface p-3 text-small text-text-secondary"
        >
          <p className="font-medium text-text-primary">Private, expiring reference</p>
          <p>
            This secure reference expires on {formatDate(openRef.expires_at)} and is never a public
            link.
          </p>
        </div>
      ) : null}
    </section>
  );
}
