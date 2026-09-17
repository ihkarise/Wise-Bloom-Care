/**
 * TrackingIsland — the Personal Wellness Tracker (docs/06-Modules/98,
 * docs/03-UX/42, `docs/ADR/ADR-007-Personal-Tracker-Timeline-Strategy.md`
 * Accepted). Lets a mother choose which curated trackers to watch, record
 * observations with a control matched to each tracker's value type, see
 * today's state at a glance, and browse history — entirely inside this one
 * card, with no new navigation, route, or modal (42 §4, BR-1). All network
 * goes through `api/` (51 BR-1).
 *
 * This module records what a mother chooses to watch; it never diagnoses,
 * interprets, or warns (98 §3) — nothing here uses `color-caution`/
 * `color-alert-emergency`, and there is no chart/trend/streak surface (98 §5,
 * 42 BR-3). `TrackerEntry` never enters the shared timeline (`ADR-007`).
 *
 * The default export is a thin container (session + data + network); the
 * presentational `TrackingIslandView` (and `TrackerRow`) take all of their
 * state through props and are exported for testing — the same split used by
 * `MedicineIsland`/`WeekKnowledgeCard`.
 */
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';

import { addTrackerEntry, listTrackerEntries, setTrackerPreference } from '../../api/tracking';
import { getMaternal } from '../../api/maternal';
import { friendlyErrorMessage } from '../../lib/errors';
import { useTrackerPreferences } from '../../state/tracking';
import { useAuthenticatedClient } from '../../state/session';

import { BooleanRecorder } from './recorders/BooleanRecorder';
import { CountRecorder } from './recorders/CountRecorder';
import { ScaleRecorder } from './recorders/ScaleRecorder';
import { TextRecorder } from './recorders/TextRecorder';

import { TRACKER_TEMPLATES } from '@wise-bloom/domain-types';

import type { GestationalAgeView } from '@wise-bloom/api-contract';
import type { TrackerEntry, TrackerPreference, TrackerTemplate } from '@wise-bloom/domain-types';

const quietButtonClass =
  'inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-small font-medium text-text-primary transition-colors hover:border-action hover:text-action focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60';

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-md bg-action px-4 py-2 text-body font-medium text-white transition-colors hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60';

/** UTC calendar-day comparison, matching the backend's `todayIsoDate()` (docs/04-Architecture/56 §3). */
function isToday(recordedAt: string, todayIso: string): boolean {
  return recordedAt.slice(0, 10) === todayIso;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Presentational pieces (props only — no session, no network)
// ---------------------------------------------------------------------------

export interface TrackerRowData {
  preference: TrackerPreference;
  template: TrackerTemplate;
  /** This tracker's entries recorded today (UTC), newest first. */
  todayEntries: TrackerEntry[];
  /** All loaded entries for this tracker, newest first — used for "last recorded" and the expanded history view. */
  history: TrackerEntry[];
  historyHasMore: boolean;
  historyLoading: boolean;
}

export interface TodayLogItem {
  trackerKey: string;
  label: string;
  entry: TrackerEntry;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatValue(template: TrackerTemplate, value: string): string {
  switch (template.value_type) {
    case 'count':
      return value;
    case 'scale':
      return `Level ${value}`;
    case 'boolean':
      return value === 'true' ? 'Yes' : 'No';
    case 'text':
    default:
      return value;
  }
}

interface TrackerRecorderProps {
  row: TrackerRowData;
  busy: boolean;
  onRecordCount: (trackerKey: string) => Promise<boolean>;
  onRecordScale: (trackerKey: string, level: number) => Promise<boolean>;
  onRecordBoolean: (trackerKey: string, value: boolean) => Promise<boolean>;
  onRecordText: (trackerKey: string, text: string) => Promise<boolean>;
}

function TrackerRecorder({
  row,
  busy,
  onRecordCount,
  onRecordScale,
  onRecordBoolean,
  onRecordText,
}: TrackerRecorderProps): ReactElement {
  const { template, todayEntries } = row;

  switch (template.value_type) {
    case 'count': {
      const todayCount = todayEntries.reduce((sum, entry) => sum + Number(entry.value), 0);
      return (
        <CountRecorder
          label={template.label}
          todayCount={todayCount}
          busy={busy}
          onRecord={() => void onRecordCount(template.tracker_key)}
        />
      );
    }
    case 'scale': {
      const selected = todayEntries[0] ? Number(todayEntries[0].value) : null;
      return (
        <ScaleRecorder
          label={template.label}
          scaleMax={template.scaleMax ?? 5}
          selected={selected}
          busy={busy}
          onRecord={(level) => void onRecordScale(template.tracker_key, level)}
        />
      );
    }
    case 'boolean': {
      const value = todayEntries[0] ? todayEntries[0].value === 'true' : null;
      return (
        <BooleanRecorder
          label={template.label}
          value={value}
          busy={busy}
          onRecord={(next) => void onRecordBoolean(template.tracker_key, next)}
        />
      );
    }
    case 'text':
    default:
      return (
        <TextRecorder
          label={template.label}
          busy={busy}
          onRecord={(text) => void onRecordText(template.tracker_key, text)}
        />
      );
  }
}

interface TrackerHistoryListProps {
  row: TrackerRowData;
  onLoadMore: (trackerKey: string) => void;
}

function TrackerHistoryList({ row, onLoadMore }: TrackerHistoryListProps): ReactElement {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-surface p-3">
      {row.history.length === 0 ? (
        <p className="text-small text-text-secondary">No entries yet.</p>
      ) : (
        <ul className="flex list-none flex-col gap-1 pl-0">
          {row.history.map((entry) => (
            <li
              key={entry.tracker_entry_id}
              className="flex items-center justify-between gap-3 border-b border-border py-1.5 text-small last:border-b-0"
            >
              <span className="text-text-secondary">
                {new Date(entry.recorded_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="font-medium text-text-primary">
                {formatValue(row.template, entry.value)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {row.historyHasMore ? (
        <button
          type="button"
          disabled={row.historyLoading}
          onClick={() => onLoadMore(row.preference.tracker_key)}
          className={`${quietButtonClass} self-start`}
        >
          {row.historyLoading ? 'Loading…' : 'Load earlier entries'}
        </button>
      ) : null}
    </div>
  );
}

interface TrackerListRowProps {
  row: TrackerRowData;
  gestationalAge: GestationalAgeView | null;
  busy: boolean;
  expanded: boolean;
  onToggleHistory: (trackerKey: string) => void;
  onLoadMoreHistory: (trackerKey: string) => void;
  onRecordCount: (trackerKey: string) => Promise<boolean>;
  onRecordScale: (trackerKey: string, level: number) => Promise<boolean>;
  onRecordBoolean: (trackerKey: string, value: boolean) => Promise<boolean>;
  onRecordText: (trackerKey: string, text: string) => Promise<boolean>;
}

function TrackerListRow({
  row,
  gestationalAge,
  busy,
  expanded,
  onToggleHistory,
  onLoadMoreHistory,
  onRecordCount,
  onRecordScale,
  onRecordBoolean,
  onRecordText,
}: TrackerListRowProps): ReactElement {
  const showWeek = row.template.context === 'pregnancy' && gestationalAge !== null;
  const recordedToday = row.todayEntries.length > 0;

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-surface-raised p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body font-semibold text-text-primary">{row.template.label}</p>
          <p className="text-caption text-text-secondary">
            {showWeek ? `Week ${gestationalAge!.weeks} · ` : ''}
            {recordedToday ? 'recorded today' : 'not yet today'}
          </p>
        </div>
        <TrackerRecorder
          row={row}
          busy={busy}
          onRecordCount={onRecordCount}
          onRecordScale={onRecordScale}
          onRecordBoolean={onRecordBoolean}
          onRecordText={onRecordText}
        />
      </div>
      <button
        type="button"
        onClick={() => onToggleHistory(row.preference.tracker_key)}
        className="self-start text-small font-medium text-link hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {expanded ? 'Hide history' : 'View history'}
      </button>
      {expanded ? <TrackerHistoryList row={row} onLoadMore={onLoadMoreHistory} /> : null}
    </li>
  );
}

interface PickerRowProps {
  template: TrackerTemplate;
  preference: TrackerPreference | undefined;
  lastRecordedAt: string | undefined;
  busy: boolean;
  onSetPreference: (trackerKey: string, active: boolean) => Promise<boolean>;
}

function PickerRow({
  template,
  preference,
  lastRecordedAt,
  busy,
  onSetPreference,
}: PickerRowProps): ReactElement {
  const isActive = preference?.active === true;
  const wasUsedBefore = preference !== undefined;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2">
      <div className="min-w-0">
        <p className="text-small font-medium text-text-primary">{template.label}</p>
        {!isActive && wasUsedBefore ? (
          <p className="text-caption text-text-secondary">
            {lastRecordedAt
              ? `Inactive · last recorded ${new Date(lastRecordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
              : 'Inactive'}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-label={template.label}
        disabled={busy}
        onClick={() => void onSetPreference(template.tracker_key, !isActive)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60 ${
          isActive ? 'border-action bg-action' : 'border-border bg-surface'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            isActive ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export interface TrackingIslandViewProps {
  activeRows: TrackerRowData[];
  catalog: TrackerTemplate[];
  preferencesByKey: Record<string, TrackerPreference>;
  lastRecordedByKey: Record<string, string | undefined>;
  todayLog: TodayLogItem[];
  gestationalAge: GestationalAgeView | null;
  loading: boolean;
  loadError: string | null;
  actionError: string | null;
  confirmation: string | null;
  subjectReady: boolean;
  busyTrackerKey: string | null;
  pickerOpen: boolean;
  onTogglePicker: () => void;
  onSetPreference: (trackerKey: string, active: boolean) => Promise<boolean>;
  onRecordCount: (trackerKey: string) => Promise<boolean>;
  onRecordScale: (trackerKey: string, level: number) => Promise<boolean>;
  onRecordBoolean: (trackerKey: string, value: boolean) => Promise<boolean>;
  onRecordText: (trackerKey: string, text: string) => Promise<boolean>;
  expandedHistoryKey: string | null;
  onToggleHistory: (trackerKey: string) => void;
  onLoadMoreHistory: (trackerKey: string) => void;
}

const CONTEXT_LABEL: Record<TrackerTemplate['context'], string> = {
  pregnancy: 'Pregnancy',
  general: 'General',
};

export function TrackingIslandView({
  activeRows,
  catalog,
  preferencesByKey,
  lastRecordedByKey,
  todayLog,
  gestationalAge,
  loading,
  loadError,
  actionError,
  confirmation,
  subjectReady,
  busyTrackerKey,
  pickerOpen,
  onTogglePicker,
  onSetPreference,
  onRecordCount,
  onRecordScale,
  onRecordBoolean,
  onRecordText,
  expandedHistoryKey,
  onToggleHistory,
  onLoadMoreHistory,
}: TrackingIslandViewProps): ReactElement {
  const isEmpty = !loading && !loadError && activeRows.length === 0 && !pickerOpen;
  const byContext = useMemo(() => {
    const groups: Record<TrackerTemplate['context'], TrackerTemplate[]> = {
      pregnancy: [],
      general: [],
    };
    for (const template of catalog) {
      groups[template.context].push(template);
    }
    return groups;
  }, [catalog]);

  return (
    <section aria-labelledby="tracking-heading" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 id="tracking-heading" className="text-h2 font-semibold text-text-primary">
          Your tracking
        </h2>
        <p className="text-small leading-relaxed text-text-secondary">
          Keep an eye on the things you personally want to watch. This is your own record — it
          doesn’t interpret or grade anything.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface-raised p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-h3 font-semibold text-text-primary">
            {pickerOpen ? 'Choose trackers' : 'Your active trackers'}
          </h3>
          <button
            type="button"
            disabled={!subjectReady}
            onClick={onTogglePicker}
            className={quietButtonClass}
          >
            {pickerOpen ? 'Done' : 'Choose trackers'}
          </button>
        </div>

        {actionError ? (
          <p
            role="alert"
            className="mt-3 rounded-md border border-caution bg-surface p-3 text-small text-text-primary"
          >
            {actionError}
          </p>
        ) : null}
        {confirmation ? (
          <p
            role="status"
            className="mt-3 rounded-md border border-positive bg-surface p-3 text-small text-text-primary"
          >
            {confirmation}
          </p>
        ) : null}

        {pickerOpen ? (
          <div className="mt-4 flex flex-col gap-4">
            {(['pregnancy', 'general'] as const).map((context) =>
              byContext[context].length > 0 ? (
                <div key={context} className="flex flex-col gap-2">
                  <p className="text-caption font-medium uppercase tracking-wide text-text-secondary">
                    {CONTEXT_LABEL[context]}
                  </p>
                  <div className="flex flex-col gap-2">
                    {byContext[context].map((template) => (
                      <PickerRow
                        key={template.tracker_key}
                        template={template}
                        preference={preferencesByKey[template.tracker_key]}
                        lastRecordedAt={lastRecordedByKey[template.tracker_key]}
                        busy={busyTrackerKey === template.tracker_key}
                        onSetPreference={onSetPreference}
                      />
                    ))}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {loadError ? (
              <p
                role="alert"
                className="rounded-md border border-caution bg-surface p-3 text-small text-text-primary"
              >
                {loadError}
              </p>
            ) : null}

            {isEmpty ? (
              <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center">
                <p className="text-body font-medium text-text-primary">
                  Choose what you’d like to track
                </p>
                <p className="mt-1 text-small text-text-secondary">
                  Baby movement, sleep, mood, or anything else you want to keep an eye on.
                </p>
                <button
                  type="button"
                  disabled={!subjectReady}
                  onClick={onTogglePicker}
                  className={`${primaryButtonClass} mt-4`}
                >
                  Browse trackers
                </button>
              </div>
            ) : null}

            {activeRows.length > 0 ? (
              <ul className="flex list-none flex-col gap-2 pl-0">
                {activeRows.map((row) => (
                  <TrackerListRow
                    key={row.preference.tracker_key}
                    row={row}
                    gestationalAge={gestationalAge}
                    busy={busyTrackerKey === row.preference.tracker_key}
                    expanded={expandedHistoryKey === row.preference.tracker_key}
                    onToggleHistory={onToggleHistory}
                    onLoadMoreHistory={onLoadMoreHistory}
                    onRecordCount={onRecordCount}
                    onRecordScale={onRecordScale}
                    onRecordBoolean={onRecordBoolean}
                    onRecordText={onRecordText}
                  />
                ))}
              </ul>
            ) : null}

            {loading ? (
              <p aria-live="polite" className="text-small text-text-secondary">
                Loading…
              </p>
            ) : null}

            {todayLog.length > 0 ? (
              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <h3 className="text-h3 font-semibold text-text-primary">Today</h3>
                <ul className="flex list-none flex-col gap-1 pl-0">
                  {todayLog.map((item) => (
                    <li
                      key={item.entry.tracker_entry_id}
                      className="flex items-center justify-between gap-3 text-small"
                    >
                      <span className="text-text-secondary">
                        {formatTime(item.entry.recorded_at)}
                      </span>
                      <span className="flex-1 text-text-primary">{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Container: wires session + data + network into the view
// ---------------------------------------------------------------------------

export interface TrackingIslandProps {
  apiBaseUrl: string;
}

export default function TrackingIsland({ apiBaseUrl }: TrackingIslandProps): ReactElement | null {
  const { client, checked } = useAuthenticatedClient(apiBaseUrl);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [busyTrackerKey, setBusyTrackerKey] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedHistoryKey, setExpandedHistoryKey] = useState<string | null>(null);

  const [entriesByTracker, setEntriesByTracker] = useState<Record<string, TrackerEntry[]>>({});
  const [entriesCursor, setEntriesCursor] = useState<Record<string, string | undefined>>({});
  const [entriesLoading, setEntriesLoading] = useState<Record<string, boolean>>({});

  const preferences = useTrackerPreferences(client);

  useEffect(() => {
    if (!client) {
      return;
    }
    getMaternal(client)
      .then((response) => setSubjectId(response.maternal.maternal_id))
      .catch(() => setActionError('We couldn’t load your record right now. Please try again.'));
  }, [client]);

  const trackerKeysSignature = useMemo(
    () =>
      preferences.preferences
        .map((preference) => preference.tracker_key)
        .sort()
        .join(','),
    [preferences.preferences],
  );

  const loadEntries = useCallback(
    (trackerKey: string) => {
      if (!client) {
        return Promise.resolve();
      }
      setEntriesLoading((prev) => ({ ...prev, [trackerKey]: true }));
      return listTrackerEntries(client, trackerKey)
        .then((page) => {
          setEntriesByTracker((prev) => ({ ...prev, [trackerKey]: page.items }));
          setEntriesCursor((prev) => ({ ...prev, [trackerKey]: page.next_cursor }));
        })
        .catch((caught: unknown) => setActionError(friendlyErrorMessage(caught)))
        .finally(() => setEntriesLoading((prev) => ({ ...prev, [trackerKey]: false })));
    },
    [client],
  );

  useEffect(() => {
    if (!client || !trackerKeysSignature) {
      return;
    }
    const keys = trackerKeysSignature.split(',');
    void Promise.all(keys.map((key) => loadEntries(key)));
    // Only re-fetch when the set of known trackers changes, not on every render.
  }, [client, trackerKeysSignature]);

  const onLoadMoreHistory = useCallback(
    (trackerKey: string) => {
      if (!client) {
        return;
      }
      const cursor = entriesCursor[trackerKey];
      setEntriesLoading((prev) => ({ ...prev, [trackerKey]: true }));
      listTrackerEntries(client, trackerKey, cursor)
        .then((page) => {
          setEntriesByTracker((prev) => ({
            ...prev,
            [trackerKey]: [...(prev[trackerKey] ?? []), ...page.items],
          }));
          setEntriesCursor((prev) => ({ ...prev, [trackerKey]: page.next_cursor }));
        })
        .catch((caught: unknown) => setActionError(friendlyErrorMessage(caught)))
        .finally(() => setEntriesLoading((prev) => ({ ...prev, [trackerKey]: false })));
    },
    [client, entriesCursor],
  );

  const recordEntry = useCallback(
    async (trackerKey: string, value: string): Promise<boolean> => {
      if (!client || !subjectId) {
        return false;
      }
      setActionError(null);
      setConfirmation(null);
      setBusyTrackerKey(trackerKey);
      try {
        await addTrackerEntry(client, { subject_id: subjectId, tracker_key: trackerKey, value });
        setConfirmation('Recorded.');
        await loadEntries(trackerKey);
        return true;
      } catch (caught) {
        setActionError(friendlyErrorMessage(caught));
        return false;
      } finally {
        setBusyTrackerKey(null);
      }
    },
    [client, subjectId, loadEntries],
  );

  const onSetPreference = useCallback(
    async (trackerKey: string, active: boolean): Promise<boolean> => {
      if (!client || !subjectId) {
        return false;
      }
      setActionError(null);
      setConfirmation(null);
      setBusyTrackerKey(trackerKey);
      try {
        await setTrackerPreference(client, {
          subject_id: subjectId,
          tracker_key: trackerKey,
          active,
        });
        setConfirmation(
          active ? 'Added to your tracking.' : 'Removed from today — your history is kept.',
        );
        preferences.reload();
        return true;
      } catch (caught) {
        setActionError(friendlyErrorMessage(caught));
        return false;
      } finally {
        setBusyTrackerKey(null);
      }
    },
    [client, subjectId, preferences],
  );

  const onToggleHistory = useCallback((trackerKey: string) => {
    setExpandedHistoryKey((current) => (current === trackerKey ? null : trackerKey));
  }, []);

  const preferencesByKey = useMemo(() => {
    const map: Record<string, TrackerPreference> = {};
    for (const preference of preferences.preferences) {
      map[preference.tracker_key] = preference;
    }
    return map;
  }, [preferences.preferences]);

  const lastRecordedByKey = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const [trackerKey, entries] of Object.entries(entriesByTracker)) {
      map[trackerKey] = entries[0]?.recorded_at;
    }
    return map;
  }, [entriesByTracker]);

  const today = todayIso();

  const activeRows: TrackerRowData[] = useMemo(
    () =>
      preferences.preferences
        .filter((preference) => preference.active)
        .map((preference) => {
          const template = TRACKER_TEMPLATES.find((t) => t.tracker_key === preference.tracker_key);
          const history = entriesByTracker[preference.tracker_key] ?? [];
          return template
            ? {
                preference,
                template,
                todayEntries: history.filter((entry) => isToday(entry.recorded_at, today)),
                history,
                historyHasMore: entriesCursor[preference.tracker_key] !== undefined,
                historyLoading: entriesLoading[preference.tracker_key] === true,
              }
            : null;
        })
        .filter((row): row is TrackerRowData => row !== null)
        .sort((a, b) => a.template.label.localeCompare(b.template.label)),
    [preferences.preferences, entriesByTracker, entriesCursor, entriesLoading, today],
  );

  const todayLog: TodayLogItem[] = useMemo(
    () =>
      activeRows
        .flatMap((row) =>
          row.todayEntries.map((entry) => ({
            trackerKey: row.preference.tracker_key,
            label: row.template.label,
            entry,
          })),
        )
        .sort((a, b) => Date.parse(b.entry.recorded_at) - Date.parse(a.entry.recorded_at)),
    [activeRows],
  );

  if (!checked) {
    return null;
  }

  return (
    <TrackingIslandView
      activeRows={activeRows}
      catalog={[...TRACKER_TEMPLATES]}
      preferencesByKey={preferencesByKey}
      lastRecordedByKey={lastRecordedByKey}
      todayLog={todayLog}
      gestationalAge={preferences.gestationalAge}
      loading={preferences.loading}
      loadError={preferences.error}
      actionError={actionError}
      confirmation={confirmation}
      subjectReady={subjectId !== null}
      busyTrackerKey={busyTrackerKey}
      pickerOpen={pickerOpen}
      onTogglePicker={() => setPickerOpen((open) => !open)}
      onSetPreference={onSetPreference}
      onRecordCount={(trackerKey) => recordEntry(trackerKey, '1')}
      onRecordScale={(trackerKey, level) => recordEntry(trackerKey, String(level))}
      onRecordBoolean={(trackerKey, value) => recordEntry(trackerKey, value ? 'true' : 'false')}
      onRecordText={(trackerKey, text) => recordEntry(trackerKey, text)}
      expandedHistoryKey={expandedHistoryKey}
      onToggleHistory={onToggleHistory}
      onLoadMoreHistory={onLoadMoreHistory}
    />
  );
}
