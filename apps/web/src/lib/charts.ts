/**
 * Chart configuration — pure functions that turn a vital series into a Chart.js
 * line-chart configuration (docs/ADR/ADR-003-Astro, docs/04-Architecture/51 §9,
 * docs/03-UX/35 §8, docs/06-Modules/83 FR-2). Kept pure (no DOM, no rendering)
 * so the config is unit-testable; `VitalChart` renders it onto a <canvas> in the
 * browser and always pairs it with a data-table alternative and a text summary
 * (docs/03-UX/40). Chart.js itself is dynamically imported at the island, so it
 * never enters the initial bundle (docs/20-Implementation/207 R-3 — bundle-bloat
 * mitigation). No reference bands, no thresholds: surfacing-only (83 BR-1).
 */
import type { ChartConfiguration } from 'chart.js';

export interface ChartPoint {
  value: number;
  /** ISO datetime of the reading — the x-axis label. */
  at: string;
}

export interface LineChartOptions {
  label: string;
  unit: string;
  /** When true, disable animation to honour prefers-reduced-motion (35 §8, 40). */
  reducedMotion?: boolean;
  /** Resolved line/point colour (a semantic design-token value, 35 BR-1). */
  color?: string;
  /** Resolved gridline colour (a semantic design-token value). */
  gridColor?: string;
}

/**
 * Default line colour: `--color-action` (sage-600). Used for SSR/tests where the
 * DOM CSS custom property is unavailable; the island resolves the live token.
 */
export const DEFAULT_CHART_COLOR = '#3e6b4f';
export const DEFAULT_GRID_COLOR = 'rgba(120, 113, 108, 0.18)';

/** Formats an ISO datetime into a short, locale-aware axis label. */
export function formatChartLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Builds a calm, single-series Chart.js line config for a vital series
 * (oldest→newest). Legend hidden, gentle tension, small points — calm, not
 * alarmist (docs/00-Vision/04). Animation is disabled under reduced motion.
 */
export function buildLineChartConfig(
  points: ChartPoint[],
  options: LineChartOptions,
): ChartConfiguration<'line'> {
  const {
    label,
    unit,
    reducedMotion = false,
    color = DEFAULT_CHART_COLOR,
    gridColor = DEFAULT_GRID_COLOR,
  } = options;

  return {
    type: 'line',
    data: {
      labels: points.map((p) => formatChartLabel(p.at)),
      datasets: [
        {
          label: `${label} (${unit})`,
          data: points.map((p) => p.value),
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 4,
          tension: 0.25,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: reducedMotion ? false : { duration: 300 },
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
        y: { grid: { color: gridColor }, ticks: { maxTicksLimit: 4 } },
      },
    },
  };
}
