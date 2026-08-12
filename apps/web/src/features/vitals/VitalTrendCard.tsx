/**
 * VitalTrendCard — the four canonical views for one vital: current, previous,
 * delta, direction (docs/06-Modules/83 FR-2). Surfacing-only and calm: it
 * states arithmetic facts, never a diagnosis or a reference band (83 BR-1).
 */
import type { ReactElement } from 'react';

import { describeTrend, directionGlyph, formatDelta, formatValue } from '../../lib/trend-format';

import type { TrendResult } from '@wise-bloom/domain-types';

export interface VitalTrendCardProps {
  trend: TrendResult;
  label: string;
}

export default function VitalTrendCard({ trend, label }: VitalTrendCardProps): ReactElement {
  const delta = formatDelta(trend);

  return (
    <div className="rounded-md border border-border bg-surface-raised p-4">
      <p className="text-caption uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="sr-only">{describeTrend(trend, label)}</p>

      {trend.current ? (
        <p className="text-h3 font-semibold text-text-primary">
          {formatValue(trend.current.value, trend.unit)}
        </p>
      ) : (
        <p className="text-body text-text-secondary">No readings yet</p>
      )}

      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-small text-text-secondary">
        {trend.previous ? (
          <div className="flex gap-1">
            <dt>Previous:</dt>
            <dd className="text-text-primary">{formatValue(trend.previous.value, trend.unit)}</dd>
          </div>
        ) : null}
        {delta ? (
          <div className="flex gap-1">
            <dt aria-hidden="true">{directionGlyph(trend.direction)}</dt>
            <dd className="text-text-primary">{delta}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
