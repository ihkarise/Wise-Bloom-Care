/**
 * RecentTimeline — the dashboard's recent-events preview (docs/06-Modules/81
 * FR-5). Read-only glance; the full continuous record lives in the timeline
 * view. Newest first, as the server returns it.
 */
import type { ReactElement } from 'react';

import type { Event } from '@wise-bloom/domain-types';

export interface RecentTimelineProps {
  events: Event[];
}

const EVENT_TYPE_LABEL: Record<Event['type'], string> = {
  vital: 'Vital logged',
  appointment: 'Appointment',
  report: 'Report added',
  medicine: 'Medicine',
  delivery: 'Delivery',
  growth: 'Growth measurement',
  milestone: 'Milestone',
  vaccination: 'Vaccination',
  journal: 'Journal entry',
  note: 'Note',
};

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

export default function RecentTimeline({ events }: RecentTimelineProps): ReactElement {
  return (
    <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
      <h2 id="recent-heading" className="text-h3 font-semibold text-text-primary">
        Recent activity
      </h2>

      {events.length === 0 ? (
        <p className="text-body text-text-secondary">
          Nothing yet — your recent moments will show here as you add them.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {events.map((event) => (
            <li
              key={event.event_id}
              className="rounded-md border border-border bg-surface-raised p-3 text-body text-text-primary"
            >
              <p className="font-medium">{EVENT_TYPE_LABEL[event.type]}</p>
              <p className="text-small text-text-secondary">{formatDate(event.occurred_at)}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
