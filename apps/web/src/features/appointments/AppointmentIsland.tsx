/**
 * AppointmentIsland — schedule an upcoming antenatal visit and see your
 * appointments in one calm list (docs/06-Modules/85,
 * docs/20-Implementation/208 MS-1.4). Mobile-first (docs/03-UX/41); every
 * scheduled visit also lands on the continuous timeline (backend appends the
 * event). All network goes through `api/` (51 BR-1).
 */
import { useEffect, useId, useMemo, useState, type FormEvent, type ReactElement } from 'react';

import { getAppointments, scheduleAppointment, updateAppointment } from '../../api/appointments';
import { getMaternal } from '../../api/maternal';
import { friendlyErrorMessage } from '../../lib/errors';
import { useAuthenticatedClient } from '../../state/session';

import type { Appointment, AppointmentStatus } from '@wise-bloom/domain-types';

export interface AppointmentIslandProps {
  apiBaseUrl: string;
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  missed: 'Missed',
};

function nowLocalDatetime(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AppointmentIsland({
  apiBaseUrl,
}: AppointmentIslandProps): ReactElement | null {
  const { client, checked } = useAuthenticatedClient(apiBaseUrl);
  const [subjectId, setSubjectId] = useState<string | null>(null);

  const [scheduledAt, setScheduledAt] = useState(nowLocalDatetime());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const whenId = useId();

  useEffect(() => {
    if (!client) {
      return;
    }
    getMaternal(client)
      .then((response) => setSubjectId(response.maternal.maternal_id))
      .catch(() => setError('We couldn’t load your record right now. Please try again.'));
  }, [client]);

  useEffect(() => {
    if (!client) {
      return;
    }
    getAppointments(client)
      .then((response) => setAppointments(response.items))
      .catch(() => setError('We couldn’t load your appointments right now. Please try again.'));
  }, [client]);

  const sorted = useMemo(
    () => [...appointments].sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at)),
    [appointments],
  );

  async function reload(): Promise<void> {
    if (!client) {
      return;
    }
    const response = await getAppointments(client);
    setAppointments(response.items);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!client || !subjectId) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await scheduleAppointment(client, {
        subject_id: subjectId,
        scheduled_at: new Date(scheduledAt).toISOString(),
      });
      await reload();
    } catch (caught) {
      setError(friendlyErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  async function setStatus(apptId: string, status: AppointmentStatus): Promise<void> {
    if (!client) {
      return;
    }
    setError(null);
    try {
      await updateAppointment(client, { appt_id: apptId, status });
      await reload();
    } catch (caught) {
      setError(friendlyErrorMessage(caught));
    }
  }

  if (!checked) {
    return null;
  }

  const inputClass =
    'rounded-md border border-border bg-surface-raised px-3 py-2 text-body text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

  return (
    <section aria-labelledby="appointments-heading" className="flex flex-col gap-4">
      <h2 id="appointments-heading" className="text-h3 font-semibold text-text-primary">
        Appointments
      </h2>
      <p className="text-small text-text-secondary">
        Add an upcoming visit so it’s part of your record. Every appointment appears on your
        timeline too.
      </p>

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
          <label htmlFor={whenId} className="text-small font-medium text-text-primary">
            When is your visit?
          </label>
          <input
            id={whenId}
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !subjectId}
          className="self-start rounded-md bg-action px-4 py-2 text-body font-medium text-white hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Add appointment'}
        </button>
      </form>

      {sorted.length === 0 ? (
        <div className="rounded-md border border-border bg-surface-raised p-4">
          <p className="text-body text-text-secondary">
            No appointments yet. Add your next visit above and it will appear here.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {sorted.map((appt) => (
            <li
              key={appt.appt_id}
              className="flex flex-col gap-2 rounded-md border border-border bg-surface-raised p-3"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-border px-2 py-0.5 text-caption uppercase tracking-wide text-text-secondary">
                  {STATUS_LABEL[appt.status]}
                </span>
                <p className="text-body font-medium text-text-primary">
                  {formatWhen(appt.scheduled_at)}
                </p>
              </div>
              {appt.status === 'scheduled' ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void setStatus(appt.appt_id, 'completed')}
                    className="rounded-md border border-border px-3 py-1 text-small font-medium text-text-primary hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    Mark completed
                  </button>
                  <button
                    type="button"
                    onClick={() => void setStatus(appt.appt_id, 'cancelled')}
                    className="rounded-md border border-border px-3 py-1 text-small font-medium text-text-primary hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
