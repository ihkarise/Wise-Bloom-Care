/**
 * TrendService — arithmetic, surfacing-only trends over vital series
 * (docs/04-Architecture/52 §6, docs/06-Modules/83). It computes exactly four
 * things — current, previous, delta, direction — and NOTHING else. It performs
 * no clinical interpretation: no ACOG/FIGO reference bands, no diagnosis, no
 * recommendation (83 BR-1, docs/02-Research/28). Reference-band work is
 * deliberately deferred (Sprint 02 decision); those thresholds live in
 * docs/02-Research/21,22 for a later, sourced feature.
 *
 * Pure computation — no storage dependency. Callers (VitalsService,
 * DashboardService) fetch the owned vitals and pass them in, so ownership/RBAC
 * is enforced upstream at the controller boundary (docs/09-Security/123).
 */

import type {
  BloodPressureReading,
  BloodPressureTrend,
  ISODateTime,
  TrendDirection,
  TrendPoint,
  TrendResult,
  Vital,
  VitalContext,
  VitalType,
} from '@wise-bloom/domain-types';

/** Canonical BP unit (docs/05-Data/72 §5). */
const BP_UNIT = 'mmHg';

function byMeasuredAtAsc(a: Vital, b: Vital): number {
  return (
    Date.parse(a.measured_at) - Date.parse(b.measured_at) || a.vital_id.localeCompare(b.vital_id)
  );
}

function toPoint(vital: Vital): TrendPoint {
  return { value: vital.value, measured_at: vital.measured_at };
}

function directionOf(delta: number | null): TrendDirection {
  if (delta === null) {
    return 'insufficient_data';
  }
  if (delta > 0) {
    return 'up';
  }
  if (delta < 0) {
    return 'down';
  }
  return 'steady';
}

export class TrendService {
  /**
   * Arithmetic trend over one numeric vital series (already filtered to a
   * single type/context by the caller, or filtered here when `context` is
   * given). `delta = current - previous`; `direction` is the sign of the
   * delta. Fewer than two samples → `insufficient_data`, no faked trend (83 §10).
   */
  computeTrend(
    vitals: Vital[],
    type: VitalType,
    unit: string,
    context?: VitalContext,
  ): TrendResult {
    const series = vitals
      .filter((v) => v.type === type && (context === undefined || v.context === context))
      .sort(byMeasuredAtAsc);

    const current = series.length >= 1 ? toPoint(series[series.length - 1] as Vital) : null;
    const previous = series.length >= 2 ? toPoint(series[series.length - 2] as Vital) : null;
    const delta = current && previous ? current.value - previous.value : null;

    return {
      type,
      ...(context !== undefined ? { context } : {}),
      unit,
      current,
      previous,
      delta,
      direction: directionOf(delta),
      sampleCount: series.length,
    };
  }

  /**
   * Pairs blood-pressure vitals (stored as two rows sharing `measured_at`) back
   * into logical readings and a per-component trend (docs/05-Data/72 §5). Each
   * component's trend is computed independently from the samples that exist, so
   * an incomplete pair (only systolic, or only diastolic) is handled safely —
   * it simply contributes to one component's series and yields a reading with a
   * `null` for the missing side, never a crash or an invented value.
   */
  computeBloodPressureTrend(vitals: Vital[], unit: string = BP_UNIT): BloodPressureTrend {
    const bp = vitals.filter((v) => v.type === 'bp');
    const systolic = this.computeTrend(bp, 'bp', unit, 'systolic');
    const diastolic = this.computeTrend(bp, 'bp', unit, 'diastolic');

    const byMoment = new Map<ISODateTime, BloodPressureReading>();
    for (const v of [...bp].sort(byMeasuredAtAsc)) {
      const reading = byMoment.get(v.measured_at) ?? {
        measured_at: v.measured_at,
        systolic: null,
        diastolic: null,
      };
      if (v.context === 'systolic') {
        reading.systolic = v.value;
      } else if (v.context === 'diastolic') {
        reading.diastolic = v.value;
      }
      byMoment.set(v.measured_at, reading);
    }

    const readings = [...byMoment.values()].sort(
      (a, b) => Date.parse(a.measured_at) - Date.parse(b.measured_at),
    );

    return { systolic, diastolic, readings };
  }
}
