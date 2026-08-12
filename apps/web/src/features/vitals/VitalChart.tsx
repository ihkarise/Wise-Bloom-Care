/**
 * VitalChart — a calm, accessible sparkline for a vital series
 * (docs/03-UX/35 §8, docs/06-Modules/83 FR-2). Inline SVG (no chart library —
 * keeps the bundle small, docs/20-Implementation/207 R-3). Accessibility
 * (docs/03-UX/40): the SVG is `role="img"` with a factual `aria-label`, and an
 * always-available data-table alternative carries the exact readings. There is
 * no animation, so reduced-motion is respected by construction.
 */
import { useId, type ReactElement } from 'react';

import { buildSparkline, type ChartPoint } from '../../lib/charts';

export interface VitalChartProps {
  points: ChartPoint[];
  label: string;
  unit: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export default function VitalChart({ points, label, unit }: VitalChartProps): ReactElement {
  const tableId = useId();
  const geo = buildSparkline(points);
  const summary =
    points.length === 0
      ? `${label}: no readings to chart yet.`
      : `${label} over ${points.length} reading${points.length === 1 ? '' : 's'}, from ${points[0]?.value} to ${points[points.length - 1]?.value} ${unit}.`;

  return (
    <figure className="flex flex-col gap-2">
      {points.length > 0 ? (
        <svg
          role="img"
          aria-label={summary}
          viewBox={`0 0 ${geo.width} ${geo.height}`}
          className="w-full rounded-md border border-border bg-surface-raised"
          preserveAspectRatio="none"
        >
          {geo.path ? (
            <path
              d={geo.path}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="text-action"
            />
          ) : null}
          {geo.dots.map((d) => (
            <circle
              key={`${d.at}-${d.value}`}
              cx={d.x}
              cy={d.y}
              r={2.5}
              className="text-action"
              fill="currentColor"
            />
          ))}
        </svg>
      ) : (
        <p className="text-small text-text-secondary">{summary}</p>
      )}

      {points.length > 0 ? (
        <details className="text-small text-text-secondary">
          <summary className="cursor-pointer">View readings as a table</summary>
          <table aria-describedby={tableId} className="mt-2 w-full text-left">
            <caption id={tableId} className="sr-only">
              {label} readings
            </caption>
            <thead>
              <tr>
                <th scope="col" className="pr-4 font-medium">
                  Date
                </th>
                <th scope="col" className="font-medium">
                  {label} ({unit})
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={`${p.at}-${p.value}`}>
                  <td className="pr-4">{formatDate(p.at)}</td>
                  <td>{p.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}
    </figure>
  );
}
