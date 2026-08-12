/**
 * TimelineView — the continuous, append-only event stream
 * (docs/08-Timeline/110, docs/20-Implementation/206 objective 4/7). Renders
 * an empty state calmly (a fresh registration has nothing to show yet — that
 * is expected, not an error) and paginates via `useTimeline`
 * (docs/04-Architecture/56 §3).
 */
import type { ReactElement } from 'react';

import { useAuthenticatedClient } from '../../state/session';
import { useTimeline } from '../../state/timeline';

import type { Event } from '@wise-bloom/domain-types';

export interface TimelineViewProps {
  apiBaseUrl: string;
}

const EVENT_TYPE_LABEL: Record<Event['type'], string> = {
  vital: 'Vital logged',
  appointment: 'Appointment',
  report: 'Report',
  medicine: 'Medicine',
  delivery: 'Delivery',
  growth: 'Growth measurement',
  milestone: 'Milestone',
  vaccination: 'Vaccination',
  journal: 'Journal entry',
  note: 'Note',
};

function formatOccurredAt(iso: string): string {
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

export default function TimelineView({ apiBaseUrl }: TimelineViewProps): ReactElement | null {
  const { client, checked } = useAuthenticatedClient(apiBaseUrl);
  const { items, loading, error, hasMore, loadMore } = useTimeline(client);

  if (!checked) {
    return null;
  }

  return (
    <section aria-labelledby="timeline-heading" className="flex flex-col gap-4">
      <h2 id="timeline-heading" className="text-h3 font-semibold text-text-primary">
        Your timeline
      </h2>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-caution bg-surface-raised p-3 text-small text-text-primary"
        >
          {error}
        </p>
      ) : null}

      {!error && items.length === 0 && !loading ? (
        <div className="rounded-md border border-border bg-surface-raised p-4">
          <p className="text-body text-text-secondary">
            Your timeline is empty for now. As you log vitals, appointments, and other moments, they
            will appear here — one continuous record.
          </p>
        </div>
      ) : null}

      {items.length > 0 ? (
        <ol className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.event_id}
              className="rounded-md border border-border bg-surface-raised p-3 text-body text-text-primary"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-border px-2 py-0.5 text-caption uppercase tracking-wide text-text-secondary">
                  {item.type}
                </span>
                <p className="font-medium">{EVENT_TYPE_LABEL[item.type]}</p>
              </div>
              <p className="text-small text-text-secondary">{formatOccurredAt(item.occurred_at)}</p>
            </li>
          ))}
        </ol>
      ) : null}

      {loading ? (
        <p aria-live="polite" className="text-small text-text-secondary">
          Loading…
        </p>
      ) : null}

      {!error && hasMore && !loading ? (
        <button
          type="button"
          onClick={loadMore}
          className="self-start rounded-md border border-border px-4 py-2 text-small font-medium text-text-primary hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Load more
        </button>
      ) : null}
    </section>
  );
}
