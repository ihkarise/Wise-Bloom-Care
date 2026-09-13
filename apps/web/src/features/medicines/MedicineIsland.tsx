/**
 * MedicineIsland — record the medicines a mother is taking, see them at a glance
 * as a gentle in-app reminder, edit them, and stop or restart them
 * (docs/06-Modules/85, docs/08-Timeline/110, docs/20-Implementation/208 MS-1.4).
 * Mobile-first and calm (docs/03-UX/41); plain language, no clinical jargon. The
 * app records and reminds — it never prescribes, doses, or advises
 * (docs/06-Modules/85 BR-1). All network goes through `api/` (51 BR-1).
 *
 * Reminders here are strictly in-app: active medicines and their schedules are
 * kept visible. There is no background notification engine, queue, email, SMS,
 * push, or time-driven trigger (deferred to the full Notification module,
 * docs/06-Modules/95, Sprint 07 per docs/20-Implementation/208 §2.3).
 *
 * A medicine is never hard-deleted; "Stop" sets it inactive and it moves to a
 * kept history, preserving the one continuous record (docs/06-Modules/85 §10).
 *
 * The default export is a thin container (session + data + network); the
 * presentational `MedicineIslandView` is exported for testing and takes all of
 * its state through props.
 */
import { useCallback, useEffect, useId, useState, type FormEvent, type ReactElement } from 'react';

import { addMedicine, updateMedicine } from '../../api/medicines';
import { getMaternal } from '../../api/maternal';
import { friendlyErrorMessage } from '../../lib/errors';
import { useMedicines } from '../../state/medicines';
import { useAuthenticatedClient } from '../../state/session';

import type { Medicine } from '@wise-bloom/domain-types';

const NAME_MAX_LENGTH = 200;
const SCHEDULE_MAX_LENGTH = 200;

const inputClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-text-primary placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-md bg-action px-4 py-2 text-body font-medium text-white transition-colors hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60';

const quietButtonClass =
  'inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-small font-medium text-text-primary transition-colors hover:border-action hover:text-action focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60';

// ---------------------------------------------------------------------------
// Presentational view (props only — no session, no network)
// ---------------------------------------------------------------------------

export interface MedicineDraft {
  name: string;
  schedule: string;
}

export interface MedicineIslandViewProps {
  medicines: Medicine[];
  loading: boolean;
  /** Error loading the list. */
  loadError: string | null;
  /** Error from an add/edit/stop action. */
  actionError: string | null;
  confirmation: string | null;
  /** True once the mother's record is loaded so the add form can submit. */
  subjectReady: boolean;
  submitting: boolean;
  /** The med_id currently being acted on (edit/stop/restart), for per-row busy state. */
  busyId: string | null;
  onAdd: (draft: MedicineDraft) => Promise<boolean>;
  onSaveEdit: (medId: string, draft: MedicineDraft) => Promise<boolean>;
  onStop: (medId: string) => Promise<boolean>;
  onRestart: (medId: string) => Promise<boolean>;
}

export function MedicineIslandView({
  medicines,
  loading,
  loadError,
  actionError,
  confirmation,
  subjectReady,
  submitting,
  busyId,
  onAdd,
  onSaveEdit,
  onStop,
  onRestart,
}: MedicineIslandViewProps): ReactElement {
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('');
  const nameId = useId();
  const scheduleId = useId();

  const canAdd =
    subjectReady && !submitting && name.trim().length > 0 && schedule.trim().length > 0;

  async function handleAdd(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!canAdd) {
      return;
    }
    const ok = await onAdd({ name: name.trim(), schedule: schedule.trim() });
    if (ok) {
      setName('');
      setSchedule('');
    }
  }

  const active = medicines.filter((medicine) => medicine.active);
  const stopped = medicines.filter((medicine) => !medicine.active);
  const isEmpty = !loading && !loadError && medicines.length === 0;

  return (
    <section aria-labelledby="medicines-heading" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 id="medicines-heading" className="text-h2 font-semibold text-text-primary">
          Medicines
        </h2>
        <p className="text-small leading-relaxed text-text-secondary">
          Keep track of the medicines and supplements you’re taking, so they sit alongside the rest
          of your record. This is a gentle reminder — your clinician decides your care.
        </p>
      </div>

      {/* Add form */}
      <form
        onSubmit={(event) => void handleAdd(event)}
        noValidate
        aria-label="Add a medicine"
        className="flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-4 sm:p-5"
      >
        {actionError ? (
          <p
            role="alert"
            className="rounded-md border border-caution bg-surface p-3 text-small text-text-primary"
          >
            {actionError}
          </p>
        ) : null}
        {confirmation ? (
          <p
            role="status"
            className="rounded-md border border-positive bg-surface p-3 text-small text-text-primary"
          >
            {confirmation}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor={nameId} className="text-small font-medium text-text-primary">
              Medicine name
            </label>
            <input
              id={nameId}
              type="text"
              value={name}
              maxLength={NAME_MAX_LENGTH}
              placeholder="e.g. Iron tablet"
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor={scheduleId} className="text-small font-medium text-text-primary">
              Schedule
            </label>
            <input
              id={scheduleId}
              type="text"
              value={schedule}
              maxLength={SCHEDULE_MAX_LENGTH}
              placeholder="e.g. Every morning"
              onChange={(event) => setSchedule(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <button type="submit" disabled={!canAdd} className={`${primaryButtonClass} self-start`}>
          {submitting ? 'Adding…' : 'Add medicine'}
        </button>
      </form>

      {/* List */}
      <div className="flex flex-col gap-4">
        {loadError ? (
          <p
            role="alert"
            className="rounded-md border border-caution bg-surface-raised p-3 text-small text-text-primary"
          >
            {loadError}
          </p>
        ) : null}

        {isEmpty ? (
          <div className="rounded-lg border border-dashed border-border bg-surface-raised p-6 text-center">
            <p className="text-body font-medium text-text-primary">No medicines yet</p>
            <p className="mt-1 text-small text-text-secondary">
              When you add one, it will appear here as a gentle reminder and on your timeline.
            </p>
          </div>
        ) : null}

        {active.length > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-h3 font-semibold text-text-primary">Currently taking</h3>
              <span className="text-caption text-text-secondary">
                {active.length} active {active.length === 1 ? 'medicine' : 'medicines'}
              </span>
            </div>
            <ul className="flex list-none flex-col gap-2 pl-0">
              {active.map((medicine) => (
                <MedicineRow
                  key={medicine.med_id}
                  medicine={medicine}
                  busy={busyId === medicine.med_id}
                  onSaveEdit={onSaveEdit}
                  onStop={onStop}
                  onRestart={onRestart}
                />
              ))}
            </ul>
          </div>
        ) : null}

        {stopped.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-h3 font-semibold text-text-secondary">Stopped</h3>
            <ul className="flex list-none flex-col gap-2 pl-0">
              {stopped.map((medicine) => (
                <MedicineRow
                  key={medicine.med_id}
                  medicine={medicine}
                  busy={busyId === medicine.med_id}
                  onSaveEdit={onSaveEdit}
                  onStop={onStop}
                  onRestart={onRestart}
                />
              ))}
            </ul>
          </div>
        ) : null}

        {loading ? (
          <p aria-live="polite" className="text-small text-text-secondary">
            Loading…
          </p>
        ) : null}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// A single medicine row: display, inline edit, and stop/restart confirmation
// ---------------------------------------------------------------------------

interface MedicineRowProps {
  medicine: Medicine;
  busy: boolean;
  onSaveEdit: (medId: string, draft: MedicineDraft) => Promise<boolean>;
  onStop: (medId: string) => Promise<boolean>;
  onRestart: (medId: string) => Promise<boolean>;
}

function MedicineRow({
  medicine,
  busy,
  onSaveEdit,
  onStop,
  onRestart,
}: MedicineRowProps): ReactElement {
  const [editing, setEditing] = useState(false);
  const [confirmingStop, setConfirmingStop] = useState(false);
  const [name, setName] = useState(medicine.name);
  const [schedule, setSchedule] = useState(medicine.schedule);
  const nameId = useId();
  const scheduleId = useId();

  const canSave = !busy && name.trim().length > 0 && schedule.trim().length > 0;

  function startEditing(): void {
    setName(medicine.name);
    setSchedule(medicine.schedule);
    setEditing(true);
    setConfirmingStop(false);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    const ok = await onSaveEdit(medicine.med_id, { name: name.trim(), schedule: schedule.trim() });
    if (ok) {
      setEditing(false);
    }
  }

  async function handleStop(): Promise<void> {
    const ok = await onStop(medicine.med_id);
    if (ok) {
      setConfirmingStop(false);
    }
  }

  if (editing) {
    return (
      <li className="rounded-lg border border-border bg-surface-raised p-4">
        <form
          onSubmit={(event) => void handleSave(event)}
          noValidate
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor={nameId} className="text-small font-medium text-text-primary">
                Medicine name
              </label>
              <input
                id={nameId}
                type="text"
                value={name}
                maxLength={NAME_MAX_LENGTH}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor={scheduleId} className="text-small font-medium text-text-primary">
                Schedule
              </label>
              <input
                id={scheduleId}
                type="text"
                value={schedule}
                maxLength={SCHEDULE_MAX_LENGTH}
                onChange={(event) => setSchedule(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={!canSave} className={primaryButtonClass}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setEditing(false)}
              className={quietButtonClass}
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className={`flex flex-col gap-3 rounded-lg border border-border p-4 ${
        medicine.active ? 'bg-surface-raised' : 'bg-surface'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={`text-body font-semibold ${
              medicine.active ? 'text-text-primary' : 'text-text-secondary'
            }`}
          >
            {medicine.name}
          </p>
          <p className="mt-0.5 text-small text-text-secondary">{medicine.schedule}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-caption font-medium uppercase tracking-wide ${
            medicine.active ? 'border-positive text-positive' : 'border-border text-text-secondary'
          }`}
        >
          {medicine.active ? 'Active' : 'Stopped'}
        </span>
      </div>

      {confirmingStop ? (
        <div
          role="group"
          aria-label={`Stop ${medicine.name}?`}
          className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-small text-text-primary">
            Stop taking this medicine? It stays in your history and can be started again.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleStop()}
              className={quietButtonClass}
            >
              {busy ? 'Stopping…' : 'Yes, stop'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmingStop(false)}
              className={quietButtonClass}
            >
              Keep taking
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={startEditing} className={quietButtonClass}>
            Edit
          </button>
          {medicine.active ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmingStop(true)}
              className={quietButtonClass}
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onRestart(medicine.med_id)}
              className={quietButtonClass}
            >
              {busy ? 'Starting…' : 'Start again'}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Container: wires session + data + network into the view
// ---------------------------------------------------------------------------

export interface MedicineIslandProps {
  apiBaseUrl: string;
}

export default function MedicineIsland({ apiBaseUrl }: MedicineIslandProps): ReactElement | null {
  const { client, checked } = useAuthenticatedClient(apiBaseUrl);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const medicines = useMedicines(client);

  useEffect(() => {
    if (!client) {
      return;
    }
    getMaternal(client)
      .then((response) => setSubjectId(response.maternal.maternal_id))
      .catch(() => setActionError('We couldn’t load your record right now. Please try again.'));
  }, [client]);

  const onAdd = useCallback(
    async (draft: MedicineDraft): Promise<boolean> => {
      if (!client || !subjectId) {
        return false;
      }
      setActionError(null);
      setConfirmation(null);
      setSubmitting(true);
      try {
        await addMedicine(client, {
          subject_id: subjectId,
          name: draft.name,
          schedule: draft.schedule,
        });
        setConfirmation('Added to your medicines and your timeline.');
        medicines.reload();
        return true;
      } catch (caught) {
        setActionError(friendlyErrorMessage(caught));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [client, subjectId, medicines],
  );

  const runRowAction = useCallback(
    async (
      medId: string,
      action: () => Promise<void>,
      successMessage: string,
    ): Promise<boolean> => {
      if (!client) {
        return false;
      }
      setActionError(null);
      setConfirmation(null);
      setBusyId(medId);
      try {
        await action();
        setConfirmation(successMessage);
        medicines.reload();
        return true;
      } catch (caught) {
        setActionError(friendlyErrorMessage(caught));
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [client, medicines],
  );

  const onSaveEdit = useCallback(
    (medId: string, draft: MedicineDraft): Promise<boolean> =>
      runRowAction(
        medId,
        async () => {
          await updateMedicine(client!, {
            med_id: medId,
            name: draft.name,
            schedule: draft.schedule,
          });
        },
        'Your changes have been saved.',
      ),
    [client, runRowAction],
  );

  const onStop = useCallback(
    (medId: string): Promise<boolean> =>
      runRowAction(
        medId,
        async () => {
          await updateMedicine(client!, { med_id: medId, active: false });
        },
        'Medicine stopped. It stays in your history.',
      ),
    [client, runRowAction],
  );

  const onRestart = useCallback(
    (medId: string): Promise<boolean> =>
      runRowAction(
        medId,
        async () => {
          await updateMedicine(client!, { med_id: medId, active: true });
        },
        'Medicine started again.',
      ),
    [client, runRowAction],
  );

  if (!checked) {
    return null;
  }

  return (
    <MedicineIslandView
      medicines={medicines.medicines}
      loading={medicines.loading}
      loadError={medicines.error}
      actionError={actionError}
      confirmation={confirmation}
      subjectReady={subjectId !== null}
      submitting={submitting}
      busyId={busyId}
      onAdd={onAdd}
      onSaveEdit={onSaveEdit}
      onStop={onStop}
      onRestart={onRestart}
    />
  );
}
