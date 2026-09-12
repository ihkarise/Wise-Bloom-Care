/**
 * AppointmentIsland — schedule a pregnancy visit, see your visits, and mark how
 * one went (docs/06-Modules/95, docs/08-Timeline/110,
 * docs/20-Implementation/208 MS-1.4). Mobile-first and calm (docs/03-UX/41);
 * plain language throughout — no clinical jargon. All network goes through
 * `api/` (51 BR-1); the appointment scaffold is context only, never a clinical
 * plan (docs/06-Modules/82 FR-5).
 *
 * A scheduled visit also appears on the one continuous timeline (the backend
 * appends an `appointment` event linked to the appointment).
 */
import { useEffect, useId, useState, type FormEvent, type ReactElement } from 'react';

import { scheduleAppointment, updateAppointmentStatus } from '../../api/appointments';
import { getMaternal } from '../../api/maternal';
import { friendlyErrorMessage } from '../../lib/errors';
import { useAppointments } from '../../state/appointments';
import { useAuthenticatedClient } from '../../state/session';

import type { Appointment, AppointmentStatus } from '@wise-bloom/domain-types';

export interface AppointmentIslandProps {
  apiBaseUrl: string;
}

/** Warm, plain-language labels for each status (no clinical jargon). */
const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Upcoming',
  completed: 'Done',
  cancelled: 'Cancelled',
  missed: 'Missed',
};

/** The outcomes a caregiver can record for a still-upcoming visit. */
const OUTCOME_ACTIONS: { status: AppointmentStatus; label: string }[] = [
  { status: 'completed', label: 'Mark done' },
  { status: 'cancelled', label: 'Cancel' },
  { status: 'missed', label: 'Missed' },
];

function nowLocalDatetime(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const appointments = useAppointments(client);
  const whenId = useId();

  useEffect(() => {
    if (!client) {
      return;
    }
    getMaternal(client)
      .then((response) => setSubjectId(response.maternal.maternal_id))
      .catch(() => setError('We couldn’t load your record right now. Please try again.'));
  }, [client]);

  async function handleSchedule(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!client || !subjectId) {
      return;
    }
    setError(null);
    setConfirmation(null);
    setSubmitting(true);
    const iso = scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString();
    try {
      await scheduleAppointment(client, { subject_id: subjectId, scheduled_at: iso });
      setConfirmation('Your visit has been added to your timeline.');
      setScheduledAt(nowLocalDatetime());
      appointments.reload();
    } catch (caught) {
      setError(friendlyErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOutcome(appt: Appointment, status: AppointmentStatus): Promise<void> {
    if (!client) {
      return;
    }
    setError(null);
    setConfirmation(null);
    setBusyId(appt.appt_id);
    try {
      await updateAppointmentStatus(client, { appt_id: appt.appt_id, status });
      appointments.reload();
    } catch (caught) {
      setError(friendlyErrorMessage(caught));
    } finally {
      setBusyId(null);
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
        Add your pregnancy visits so they sit alongside the rest of your record. This is a place to
        keep track — your clinician decides your care.
      </p>

      <form
        onSubmit={(event) => void handleSchedule(event)}
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
        {confirmation ? (
          <p
            role="status"
            className="rounded-md border border-border bg-surface-raised p-3 text-small text-text-primary"
          >
            {confirmation}
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
            onChange={(event) => setScheduledAt(event.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !subjectId}
          className="self-start rounded-md bg-action px-4 py-2 text-body font-medium text-white hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
        >
          {submitting ? 'Adding…' : 'Schedule visit'}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        <h3 className="text-body font-semibold text-text-primary">Your visits</h3>

        {appointments.error ? (
          <p
            role="alert"
            className="rounded-md border border-caution bg-surface-raised p-3 text-small text-text-primary"
          >
            {appointments.error}
          </p>
        ) : null}

        {!appointments.error && appointments.appointments.length === 0 && !appointments.loading ? (
          <div className="rounded-md border border-border bg-surface-raised p-4">
            <p className="text-body text-text-secondary">
              No visits yet. When you add one, it will appear here and on your timeline.
            </p>
          </div>
        ) : null}

        {appointments.appointments.length > 0 ? (
          <ol className="flex flex-col gap-2">
            {appointments.appointments.map((appt) => (
              <li
                key={appt.appt_id}
                className="flex flex-col gap-2 rounded-md border border-border bg-surface-raised p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-body font-medium text-text-primary">
                    {formatWhen(appt.scheduled_at)}
                  </p>
                  <span className="rounded-full border border-border px-2 py-0.5 text-caption uppercase tracking-wide text-text-secondary">
                    {STATUS_LABEL[appt.status]}
                  </span>
                </div>

                {appt.status === 'scheduled' ? (
                  <div className="flex flex-wrap gap-2">
                    {OUTCOME_ACTIONS.map((action) => (
                      <button
                        key={action.status}
                        type="button"
                        disabled={busyId === appt.appt_id}
                        onClick={() => void handleOutcome(appt, action.status)}
                        className="rounded-md border border-border px-3 py-1 text-small font-medium text-text-primary hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}

        {appointments.loading ? (
          <p aria-live="polite" className="text-small text-text-secondary">
            Loading…
          </p>
        ) : null}
      </div>
    </section>
  );
}
