/**
 * VitalChart — a calm, accessible Chart.js line chart for one vital series
 * (docs/ADR/ADR-003-Astro, docs/04-Architecture/51 §9, docs/03-UX/35 §8,
 * docs/06-Modules/83 FR-2). Chart.js is dynamically imported so it stays out of
 * the initial bundle (docs/20-Implementation/207 R-3). Accessibility
 * (docs/03-UX/40): the <canvas> is `role="img"` with a factual `aria-label`, and
 * an always-available data-table alternative carries the exact readings, so the
 * meaning never depends on the canvas. `prefers-reduced-motion` disables the
 * chart animation. Where no 2D context exists (SSR / tests / unsupported), the
 * data-table alternative stands in on its own.
 */
import { useEffect, useId, useRef, type ReactElement } from 'react';

import {
  buildLineChartConfig,
  DEFAULT_CHART_COLOR,
  DEFAULT_GRID_COLOR,
  type ChartPoint,
} from '../../lib/charts';

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

/** Reads a semantic design-token value from the document root, with a fallback. */
function resolveToken(name: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') return fallback;
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value.length > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function VitalChart({ points, label, unit }: VitalChartProps): ReactElement {
  const tableId = useId();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const summary =
    points.length === 0
      ? `${label}: no readings to chart yet.`
      : `${label} over ${points.length} reading${points.length === 1 ? '' : 's'}, from ${points[0]?.value} to ${points[points.length - 1]?.value} ${unit}.`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;
    const ctx = canvas.getContext('2d');
    // No 2D context (SSR / jsdom / unsupported) → the data-table alternative stands in.
    if (!ctx) return;

    let cancelled = false;
    let chart: { destroy: () => void } | undefined;

    const config = buildLineChartConfig(points, {
      label,
      unit,
      reducedMotion: prefersReducedMotion(),
      color: resolveToken('--color-action', DEFAULT_CHART_COLOR),
      gridColor: resolveToken('--color-border', DEFAULT_GRID_COLOR),
    });

    void import('chart.js/auto')
      .then(({ default: Chart }) => {
        if (cancelled) return;
        chart = new Chart(ctx, config);
      })
      .catch(() => {
        /* Chart.js failed to load → the data-table alternative remains. */
      });

    return () => {
      cancelled = true;
      chart?.destroy();
    };
  }, [points, label, unit]);

  return (
    <figure className="flex flex-col gap-2">
      {points.length > 0 ? (
        <div className="h-24 w-full rounded-md border border-border bg-surface-raised p-1">
          <canvas ref={canvasRef} role="img" aria-label={summary} />
        </div>
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
