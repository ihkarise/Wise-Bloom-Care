/**
 * ReportUploadIsland — upload a lab/ultrasound report and view your reports
 * (docs/06-Modules/84, docs/20-Implementation/207 MS-1.5). Media stays private:
 * the client hands the backend an opaque upload handle and the backend mints a
 * private media_ref; there is never a public link (84 BR-1).
 *
 * v1 limitation: this build captures report metadata + an opaque handle (the
 * chosen file's name) rather than streaming bytes to Drive — the byte-transfer
 * pipeline (docs/07-AI/106 OCR, Drive storage) is a later sprint. The privacy
 * boundary (private ref, short-lived view refs) is already fully enforced.
 */
import { useEffect, useId, useState, type FormEvent, type ReactElement } from 'react';

import { getMaternal } from '../../api/maternal';
import { uploadReport } from '../../api/reports';
import { friendlyErrorMessage } from '../../lib/errors';
import { useAuthenticatedClient } from '../../state/session';
import ReportViewer from './ReportViewer';

export interface ReportUploadIslandProps {
  apiBaseUrl: string;
}

const REPORT_KINDS = ['ultrasound', 'lab', 'other'] as const;

export default function ReportUploadIsland({
  apiBaseUrl,
}: ReportUploadIslandProps): ReactElement | null {
  const { client, checked } = useAuthenticatedClient(apiBaseUrl);
  const [subjectId, setSubjectId] = useState<string | null>(null);

  const [kind, setKind] = useState<string>('ultrasound');
  const [fileName, setFileName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const kindId = useId();
  const fileId = useId();

  useEffect(() => {
    if (!client) {
      return;
    }
    getMaternal(client)
      .then((response) => setSubjectId(response.maternal.maternal_id))
      .catch(() => setError('We couldn’t load your record right now. Please try again.'));
  }, [client]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!client || !subjectId || !fileName) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await uploadReport(client, {
        subject_id: subjectId,
        kind,
        // Opaque handle — never a public URL; the backend mints the private media_ref.
        media_upload_ref: `upload:${fileName}`,
      });
      setFileName('');
      setReloadToken((n) => n + 1);
    } catch (caught) {
      setError(friendlyErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (!checked) {
    return null;
  }

  const inputClass =
    'rounded-md border border-border bg-surface-raised px-3 py-2 text-body text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

  return (
    <section aria-labelledby="reports-heading" className="flex flex-col gap-4">
      <h2 id="reports-heading" className="text-h3 font-semibold text-text-primary">
        Reports
      </h2>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        className="flex flex-col gap-4"
      >
        {error ? (
          <p
            role="alert"
            className="rounded-md border border-caution bg-surface p-3 text-small text-text-primary"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-1">
          <label htmlFor={kindId} className="text-small font-medium text-text-primary">
            Report type
          </label>
          <select
            id={kindId}
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className={inputClass}
          >
            {REPORT_KINDS.map((k) => (
              <option key={k} value={k}>
                {k[0]?.toUpperCase()}
                {k.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={fileId} className="text-small font-medium text-text-primary">
            Choose a file
          </label>
          <input
            id={fileId}
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
            className={inputClass}
          />
          <p className="text-caption text-text-secondary">
            Stored privately — only you can open it, through a secure link that expires.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || !subjectId || !fileName}
          className="self-start rounded-md bg-action px-4 py-2 text-body font-medium text-white hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
        >
          {submitting ? 'Uploading…' : 'Upload report'}
        </button>
      </form>

      <ReportViewer client={client} reloadToken={reloadToken} />
    </section>
  );
}
