/**
 * TrackingIslandView tests (docs/03-UX/42, docs/06-Modules/98, Phase 2). The
 * view is presentational (props only), so these cover all 11 planned UI
 * states without needing session or network mocks — first use, the picker,
 * today's active trackers, each of the four value-type recorders, today's
 * history, per-tracker history, and deactivate/reactivate.
 *
 * The real v1 launch catalog (`@wise-bloom/domain-types` `TRACKER_TEMPLATES`)
 * ships only `count`/`scale` trackers (98 §22 D-4); the boolean/text recorder
 * states use small fixture templates here, mirroring the backend's fixture
 * catalog in `tests/services/tracking.test.ts`, rather than expanding the
 * real launch set.
 */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  TrackingIslandView,
  type TodayLogItem,
  type TrackerRowData,
  type TrackingIslandViewProps,
} from '../../src/features/tracking/TrackingIsland';

import { TRACKER_TEMPLATES } from '@wise-bloom/domain-types';
import type { TrackerEntry, TrackerPreference, TrackerTemplate } from '@wise-bloom/domain-types';

const TODAY = '2026-09-17T08:00:00.000Z';
const YESTERDAY = '2026-09-16T08:00:00.000Z';

const BOOLEAN_FIXTURE: TrackerTemplate = {
  tracker_key: 'fixture_boolean',
  label: 'Fixture boolean',
  value_type: 'boolean',
  context: 'general',
};

const TEXT_FIXTURE: TrackerTemplate = {
  tracker_key: 'fixture_text',
  label: 'Fixture text',
  value_type: 'text',
  context: 'general',
};

function templateFor(key: string): TrackerTemplate {
  const found = TRACKER_TEMPLATES.find((t) => t.tracker_key === key);
  if (!found) {
    throw new Error(`No fixture template for key: ${key}`);
  }
  return found;
}

function preference(trackerKey: string, active: boolean): TrackerPreference {
  return {
    tracker_pref_id: `pref-${trackerKey}`,
    subject_id: 'maternal-1',
    tracker_key: trackerKey,
    active,
  };
}

function entry(trackerKey: string, value: string, recordedAt: string): TrackerEntry {
  return {
    tracker_entry_id: `${trackerKey}-${recordedAt}-${value}`,
    subject_id: 'maternal-1',
    tracker_key: trackerKey,
    value,
    recorded_at: recordedAt,
    version: 1,
    created_by: 'user-1',
  };
}

function rowFor(
  template: TrackerTemplate,
  overrides: Partial<TrackerRowData> = {},
): TrackerRowData {
  return {
    preference: preference(template.tracker_key, true),
    template,
    todayEntries: [],
    history: [],
    historyHasMore: false,
    historyLoading: false,
    ...overrides,
  };
}

function row(trackerKey: string, overrides: Partial<TrackerRowData> = {}): TrackerRowData {
  return rowFor(templateFor(trackerKey), overrides);
}

function baseProps(overrides: Partial<TrackingIslandViewProps> = {}): TrackingIslandViewProps {
  return {
    activeRows: [],
    catalog: [...TRACKER_TEMPLATES],
    preferencesByKey: {},
    lastRecordedByKey: {},
    todayLog: [],
    gestationalAge: null,
    loading: false,
    loadError: null,
    actionError: null,
    confirmation: null,
    subjectReady: true,
    busyTrackerKey: null,
    pickerOpen: false,
    onTogglePicker: vi.fn(),
    onSetPreference: vi.fn(async () => true),
    onRecordCount: vi.fn(async () => true),
    onRecordScale: vi.fn(async () => true),
    onRecordBoolean: vi.fn(async () => true),
    onRecordText: vi.fn(async () => true),
    expandedHistoryKey: null,
    onToggleHistory: vi.fn(),
    onLoadMoreHistory: vi.fn(),
    ...overrides,
  };
}

describe('TrackingIslandView', () => {
  it('renders a labelled section', () => {
    const { container } = render(<TrackingIslandView {...baseProps()} />);
    expect(screen.getByRole('heading', { name: 'Your tracking' })).toBeTruthy();
    expect(container.querySelector('section[aria-labelledby="tracking-heading"]')).toBeTruthy();
  });

  it('State 1 — first use: shows the calm empty invitation, not a wall of every tracker', () => {
    render(<TrackingIslandView {...baseProps()} />);
    expect(screen.getByText('Choose what you’d like to track')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Browse trackers' })).toBeTruthy();
  });

  it('State 2 — picker expanded: lists the catalog grouped by Pregnancy / General', () => {
    render(<TrackingIslandView {...baseProps({ pickerOpen: true })} />);
    expect(screen.getByText('Pregnancy')).toBeTruthy();
    expect(screen.getByText('General')).toBeTruthy();
    expect(screen.getByText('Baby movement / kicking')).toBeTruthy();
    expect(screen.getByText('Mood')).toBeTruthy();
  });

  it('opens and labels the picker toggle correctly in each state', () => {
    const onTogglePicker = vi.fn();
    const { rerender } = render(<TrackingIslandView {...baseProps({ onTogglePicker })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose trackers' }));
    expect(onTogglePicker).toHaveBeenCalled();

    rerender(<TrackingIslandView {...baseProps({ pickerOpen: true, onTogglePicker })} />);
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy();
  });

  it('State 3 — active daily trackers: one row per active tracker, correct today status', () => {
    render(
      <TrackingIslandView
        {...baseProps({
          activeRows: [
            row('baby_movement', { todayEntries: [entry('baby_movement', '1', TODAY)] }),
            row('bloating', {}),
          ],
          gestationalAge: { days: 182, weeks: 26, daysIntoWeek: 0 },
        })}
      />,
    );
    expect(screen.getByText('Baby movement / kicking')).toBeTruthy();
    expect(screen.getByText('Bloating')).toBeTruthy();
    expect(screen.getAllByText(/Week 26/).length).toBe(2);
    expect(screen.getByText(/not yet today/)).toBeTruthy();
  });

  it('State 4 — count tracker: tapping + calls onRecordCount and today’s tally is the sum of today’s entries', () => {
    const onRecordCount = vi.fn(async () => true);
    render(
      <TrackingIslandView
        {...baseProps({
          activeRows: [
            row('baby_movement', {
              todayEntries: [
                entry('baby_movement', '1', TODAY),
                entry('baby_movement', '1', TODAY),
              ],
            }),
          ],
          onRecordCount,
        })}
      />,
    );
    expect(screen.getByText('2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Log another/i }));
    expect(onRecordCount).toHaveBeenCalledWith('baby_movement');
  });

  it('State 5 — scale tracker: highlights today’s level and tapping another calls onRecordScale', () => {
    const onRecordScale = vi.fn(async () => true);
    render(
      <TrackingIslandView
        {...baseProps({
          activeRows: [row('bloating', { todayEntries: [entry('bloating', '3', TODAY)] })],
          onRecordScale,
        })}
      />,
    );
    const group = screen.getByRole('group', { name: 'Bloating level' });
    expect(within(group).getByRole('button', { name: '3' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    fireEvent.click(within(group).getByRole('button', { name: '5' }));
    expect(onRecordScale).toHaveBeenCalledWith('bloating', 5);
  });

  it('State 6 — boolean tracker (fixture): tapping the switch calls onRecordBoolean with the flipped value', () => {
    const onRecordBoolean = vi.fn(async () => true);
    render(
      <TrackingIslandView
        {...baseProps({
          activeRows: [rowFor(BOOLEAN_FIXTURE, {})],
          onRecordBoolean,
        })}
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Fixture boolean' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    expect(onRecordBoolean).toHaveBeenCalledWith('fixture_boolean', true);
  });

  it('State 7 — text tracker (fixture): submitting a note calls onRecordText and clears the field', async () => {
    const onRecordText = vi.fn(async () => true);
    render(
      <TrackingIslandView
        {...baseProps({
          activeRows: [rowFor(TEXT_FIXTURE, {})],
          onRecordText,
        })}
      />,
    );
    const input = screen.getByLabelText('Fixture text note') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Felt tired' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(onRecordText).toHaveBeenCalledWith('fixture_text', 'Felt tired'));
    await waitFor(() => expect(input.value).toBe(''));
  });

  it('State 8 — today’s history: lists every entry recorded today across trackers', () => {
    render(
      <TrackingIslandView
        {...baseProps({
          activeRows: [row('baby_movement', {})],
          todayLog: [
            {
              trackerKey: 'baby_movement',
              label: 'Baby movement / kicking',
              entry: entry('baby_movement', '1', TODAY),
            } satisfies TodayLogItem,
          ],
        })}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Today' })).toBeTruthy();
  });

  it('State 9 — per-tracker history: expanding shows past entries and can load more', () => {
    const onToggleHistory = vi.fn();
    const onLoadMoreHistory = vi.fn();
    render(
      <TrackingIslandView
        {...baseProps({
          activeRows: [
            row('baby_movement', {
              history: [entry('baby_movement', '3', YESTERDAY)],
              historyHasMore: true,
            }),
          ],
          expandedHistoryKey: 'baby_movement',
          onToggleHistory,
          onLoadMoreHistory,
        })}
      />,
    );
    expect(screen.getByRole('button', { name: 'Load earlier entries' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Load earlier entries' }));
    expect(onLoadMoreHistory).toHaveBeenCalledWith('baby_movement');

    fireEvent.click(screen.getByRole('button', { name: 'Hide history' }));
    expect(onToggleHistory).toHaveBeenCalledWith('baby_movement');
  });

  it('State 10 — deactivated tracker: the picker shows an inactive caption with the last-recorded date', () => {
    render(
      <TrackingIslandView
        {...baseProps({
          pickerOpen: true,
          preferencesByKey: { sleep_quality: preference('sleep_quality', false) },
          lastRecordedByKey: { sleep_quality: YESTERDAY },
        })}
      />,
    );
    expect(screen.getByText(/Inactive · last recorded/)).toBeTruthy();
  });

  it('State 11 — reactivated tracker: tapping an inactive tracker’s switch calls onSetPreference(key, true)', () => {
    const onSetPreference = vi.fn(async () => true);
    render(
      <TrackingIslandView
        {...baseProps({
          pickerOpen: true,
          preferencesByKey: { sleep_quality: preference('sleep_quality', false) },
          onSetPreference,
        })}
      />,
    );
    fireEvent.click(screen.getByRole('switch', { name: 'Sleep quality' }));
    expect(onSetPreference).toHaveBeenCalledWith('sleep_quality', true);
  });

  it('deactivating an active tracker calls onSetPreference(key, false)', () => {
    const onSetPreference = vi.fn(async () => true);
    render(
      <TrackingIslandView
        {...baseProps({
          pickerOpen: true,
          preferencesByKey: { baby_movement: preference('baby_movement', true) },
          onSetPreference,
        })}
      />,
    );
    fireEvent.click(screen.getByRole('switch', { name: 'Baby movement / kicking' }));
    expect(onSetPreference).toHaveBeenCalledWith('baby_movement', false);
  });

  it('shows a loading indicator while loading', () => {
    render(<TrackingIslandView {...baseProps({ loading: true })} />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('shows the list error as an alert', () => {
    render(<TrackingIslandView {...baseProps({ loadError: 'We couldn’t load your trackers.' })} />);
    expect(screen.getByRole('alert').textContent).toContain('couldn’t load');
  });

  it('shows an action error and a confirmation with the right roles', () => {
    const { rerender } = render(
      <TrackingIslandView {...baseProps({ actionError: 'Something went wrong.' })} />,
    );
    expect(screen.getByRole('alert').textContent).toContain('Something went wrong.');

    rerender(<TrackingIslandView {...baseProps({ confirmation: 'Recorded.' })} />);
    expect(screen.getByRole('status').textContent).toContain('Recorded.');
  });

  it('never renders a caution/alert-emergency colour class anywhere (98 §3 — records, does not warn)', () => {
    const { container } = render(
      <TrackingIslandView
        {...baseProps({
          pickerOpen: true,
          activeRows: [row('baby_movement', {})],
          todayLog: [
            {
              trackerKey: 'baby_movement',
              label: 'Baby movement / kicking',
              entry: entry('baby_movement', '1', TODAY),
            },
          ],
        })}
      />,
    );
    expect(container.querySelectorAll('[class*="alert-emergency"]').length).toBe(0);
  });
});
