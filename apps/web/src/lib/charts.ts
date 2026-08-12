/**
 * Chart geometry — pure functions that turn a vital series into SVG sparkline
 * coordinates (docs/03-UX/35 §8, docs/06-Modules/83 FR-2). No rendering, no
 * DOM, no library: keeping the maths pure makes the charts testable and keeps
 * the bundle small (docs/20-Implementation/207 R-3 — chart-JS bloat mitigation).
 *
 * The rendered chart is always paired with a data-table alternative and an
 * accessible text summary (docs/03-UX/40); this module only computes geometry.
 */

export interface ChartPoint {
  value: number;
  /** ISO datetime of the reading — the x-axis label. */
  at: string;
}

export interface SparklineGeometry {
  width: number;
  height: number;
  /** SVG path `d` through the points, or `''` when there is nothing to draw. */
  path: string;
  dots: { x: number; y: number; value: number; at: string }[];
  min: number;
  max: number;
}

export interface SparklineOptions {
  width?: number;
  height?: number;
  padding?: number;
}

/**
 * Builds sparkline geometry for a series, oldest→newest. The y-axis is scaled
 * to the data range and inverted (SVG y grows downward). A flat series (equal
 * min/max) is drawn along the vertical mid-line rather than dividing by zero.
 */
export function buildSparkline(
  points: ChartPoint[],
  options: SparklineOptions = {},
): SparklineGeometry {
  const width = options.width ?? 320;
  const height = options.height ?? 96;
  const padding = options.padding ?? 8;

  if (points.length === 0) {
    return { width, height, path: '', dots: [], min: 0, max: 0 };
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const xAt = (index: number): number =>
    points.length === 1 ? width / 2 : padding + (innerW * index) / (points.length - 1);
  const yAt = (value: number): number =>
    span === 0 ? height / 2 : padding + innerH * (1 - (value - min) / span);

  const dots = points.map((p, index) => ({
    x: round(xAt(index)),
    y: round(yAt(p.value)),
    value: p.value,
    at: p.at,
  }));

  const path = dots.map((d, index) => `${index === 0 ? 'M' : 'L'} ${d.x} ${d.y}`).join(' ');

  return { width, height, path, dots, min, max };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
