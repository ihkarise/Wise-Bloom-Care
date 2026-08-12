/**
 * Trend formatting — calm, factual, NON-diagnostic copy for vital trends
 * (docs/06-Modules/83 BR-1, docs/02-Research/28). These are pure functions:
 * they describe an arithmetic comparison ("higher than last time"), never a
 * clinical judgement ("high", "normal", "concerning"). No thresholds, no
 * reference bands (Sprint 02 decision — deferred to sourced clinical work).
 */

import type { TrendDirection, TrendResult } from '@wise-bloom/domain-types';

/** A short, non-diagnostic phrase for a trend direction. */
export function formatDirection(direction: TrendDirection): string {
  switch (direction) {
    case 'up':
      return 'Higher than your last reading';
    case 'down':
      return 'Lower than your last reading';
    case 'steady':
      return 'About the same as last time';
    case 'insufficient_data':
    default:
      return 'Not enough readings yet to show a trend';
  }
}

/** A decorative directional glyph (paired with text, never the sole signal — docs/03-UX/40). */
export function directionGlyph(direction: TrendDirection): string {
  switch (direction) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'steady':
      return '→';
    case 'insufficient_data':
    default:
      return '·';
  }
}

/** Formats a value with its unit for display (canonical units; conversion is a future feature). */
export function formatValue(value: number, unit: string): string {
  return `${value} ${unit}`;
}

/** A signed change since the previous reading, or `null` when there isn't one. */
export function formatDelta(trend: TrendResult): string | null {
  if (trend.delta === null) {
    return null;
  }
  const sign = trend.delta > 0 ? '+' : '';
  return `${sign}${trend.delta} ${trend.unit} since your last reading`;
}

/**
 * A complete accessible sentence describing a trend — used as an aria-label /
 * screen-reader summary so the meaning never depends on colour or glyph alone
 * (docs/03-UX/40). Purely factual.
 */
export function describeTrend(trend: TrendResult, label: string): string {
  if (!trend.current) {
    return `${label}: no readings yet.`;
  }
  const current = `${label}: ${formatValue(trend.current.value, trend.unit)}.`;
  const change = formatDelta(trend);
  return change ? `${current} ${change}.` : `${current} ${formatDirection(trend.direction)}.`;
}
