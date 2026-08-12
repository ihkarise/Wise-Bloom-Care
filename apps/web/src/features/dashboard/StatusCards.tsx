/**
 * StatusCards — the dashboard's life-stage status header and metric tiles
 * (docs/06-Modules/81 FR-1, FR-4). Calm and non-diagnostic: tiles show
 * current + trend only (81 BR-2). Blood pressure is surfaced as its paired
 * systolic/diastolic tiles.
 */
import type { ReactElement } from 'react';

import VitalTrendCard from '../vitals/VitalTrendCard';

import type { DashboardSummary } from '@wise-bloom/domain-types';

export interface StatusCardsProps {
  summary: DashboardSummary;
}

function statusHeadline(summary: DashboardSummary): string {
  const weeks = summary.status.pregnancy_weeks;
  if (typeof weeks === 'number') {
    return `About ${weeks} week${weeks === 1 ? '' : 's'} into your pregnancy`;
  }
  return 'Your pregnancy record';
}

export default function StatusCards({ summary }: StatusCardsProps): ReactElement {
  const hasTiles = summary.metrics.length > 0 || Boolean(summary.blood_pressure);

  return (
    <section aria-labelledby="status-heading" className="flex flex-col gap-4">
      <div className="rounded-md border border-border bg-surface-raised p-4">
        <h2 id="status-heading" className="text-h3 font-semibold text-text-primary">
          {statusHeadline(summary)}
        </h2>
      </div>

      {hasTiles ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {summary.metrics.map((metric) => (
            <VitalTrendCard key={metric.vital_type} trend={metric.trend} label={metric.label} />
          ))}
          {summary.blood_pressure ? (
            <>
              <VitalTrendCard
                trend={summary.blood_pressure.systolic}
                label="Blood pressure — systolic"
              />
              <VitalTrendCard
                trend={summary.blood_pressure.diastolic}
                label="Blood pressure — diastolic"
              />
            </>
          ) : null}
        </div>
      ) : (
        <p className="text-body text-text-secondary">
          Once you log a vital, your latest readings and trends will appear here.
        </p>
      )}
    </section>
  );
}
