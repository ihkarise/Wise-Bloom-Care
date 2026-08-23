/**
 * VitalsService — logs maternal vitals and turns them into timeline events +
 * arithmetic trends (docs/06-Modules/83, docs/20-Implementation/207 Task 2).
 *
 * Every log: validate (structural + formula-injection guard, docs/05-Data/73),
 * persist the Vital(s) through the StorageAdapter, append a `vital` timeline
 * event (docs/04-Architecture/56 §5), and return the event + created record(s)
 * + a surfacing-only trend (docs/06-Modules/83 BR-1 — never diagnostic).
 *
 * Blood pressure is one logical reading stored as two Vital rows — systolic and
 * diastolic sharing an identical `measured_at` (frozen domain model,
 * docs/05-Data/72 §5) — and a single `vital` timeline event.
 */

import { newId } from '../lib/ids';
import { isIsoDateTime, isNotFuture, sanitizeString, ValidationError } from '../lib/validation';

import type { TrendService } from './TrendService';
import type { TimelineService } from './TimelineService';
import type { StorageAdapter } from '../adapters/StorageAdapter';
import type {
  BloodPressureTrend,
  Event,
  ISODateTime,
  LifeStage,
  TrendResult,
  UUID,
  Vital,
  VitalContext,
  VitalType,
} from '@wise-bloom/domain-types';

/** Canonical units per docs/05-Data/72 §5 (stored; display conversion is client-side). */
const DEFAULT_UNIT: Record<VitalType, string> = {
  bp: 'mmHg',
  weight: 'kg',
  blood_sugar: 'mg/dL',
};

const SINGLE_VALUE_TYPES: readonly VitalType[] = ['weight', 'blood_sugar'];

export interface LogVitalInput {
  familyId: UUID;
  subjectId: UUID;
  createdBy: UUID;
  type: Exclude<VitalType, 'bp'>;
  value: number;
  unit?: string;
  context?: VitalContext;
  measuredAt: ISODateTime;
  /** Life stage of the record the vital belongs to; Sprint 02 vitals are pregnancy-scoped (default). */
  lifeStage?: LifeStage;
}

export interface LogBloodPressureInput {
  familyId: UUID;
  subjectId: UUID;
  createdBy: UUID;
  systolic: number;
  diastolic: number;
  unit?: string;
  measuredAt: ISODateTime;
  lifeStage?: LifeStage;
}

export interface LogVitalResult {
  event: Event;
  vital: Vital;
  trend: TrendResult;
}

export interface LogBloodPressureResult {
  event: Event;
  vitals: Vital[];
  trend: BloodPressureTrend;
}

function assertMeasuredAt(measuredAt: string): void {
  if (!isIsoDateTime(measuredAt)) {
    throw new ValidationError('measured_at must be an ISO 8601 UTC datetime');
  }
  if (!isNotFuture(measuredAt)) {
    throw new ValidationError('measured_at cannot be in the future');
  }
}

function assertValue(value: number, field: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new ValidationError(`${field} must be a positive number`);
  }
}

/** A plain unit string, formula-injection-neutralised (docs/05-Data/73 §8). */
function safeUnit(unit: string | undefined, type: VitalType): string {
  const raw = unit && unit.trim() ? unit.trim() : DEFAULT_UNIT[type];
  return sanitizeString(raw);
}

export class VitalsService {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly timeline: TimelineService,
    private readonly trend: TrendService,
  ) {}

  private ownedVitals(subjectId: UUID): Vital[] {
    return this.storage.query('Vital', { subject_id: subjectId });
  }

  /** Logs a single-value vital (weight or blood sugar). */
  logVital(input: LogVitalInput): LogVitalResult {
    if (!SINGLE_VALUE_TYPES.includes(input.type)) {
      throw new ValidationError('Use logBloodPressure for blood pressure readings');
    }
    assertValue(input.value, 'value');
    assertMeasuredAt(input.measuredAt);
    const unit = safeUnit(input.unit, input.type);

    const vital: Vital = {
      vital_id: newId(),
      subject_id: input.subjectId,
      type: input.type,
      value: input.value,
      unit,
      ...(input.context !== undefined ? { context: input.context } : {}),
      measured_at: input.measuredAt,
    };
    const created = this.storage.create('Vital', vital);

    const event = this.timeline.append({
      familyId: input.familyId,
      subjectId: input.subjectId,
      type: 'vital',
      lifeStage: input.lifeStage ?? 'pregnancy',
      occurredAt: input.measuredAt,
      createdBy: input.createdBy,
    });

    const trend = this.trend.computeTrend(
      this.ownedVitals(input.subjectId),
      input.type,
      unit,
      input.context,
    );

    return { event, vital: created, trend };
  }

  /**
   * Logs one blood-pressure reading as two Vital rows (systolic + diastolic)
   * sharing `measured_at`, plus a single `vital` timeline event. Returns the
   * event, both rows (`[systolic, diastolic]`), and the paired BP trend.
   */
  logBloodPressure(input: LogBloodPressureInput): LogBloodPressureResult {
    assertValue(input.systolic, 'systolic');
    assertValue(input.diastolic, 'diastolic');
    assertMeasuredAt(input.measuredAt);
    const unit = safeUnit(input.unit, 'bp');

    const make = (value: number, context: VitalContext): Vital => ({
      vital_id: newId(),
      subject_id: input.subjectId,
      type: 'bp',
      value,
      unit,
      context,
      measured_at: input.measuredAt,
    });

    const systolic = this.storage.create('Vital', make(input.systolic, 'systolic'));
    const diastolic = this.storage.create('Vital', make(input.diastolic, 'diastolic'));

    const event = this.timeline.append({
      familyId: input.familyId,
      subjectId: input.subjectId,
      type: 'vital',
      lifeStage: input.lifeStage ?? 'pregnancy',
      occurredAt: input.measuredAt,
      createdBy: input.createdBy,
    });

    const trend = this.trend.computeBloodPressureTrend(this.ownedVitals(input.subjectId), unit);

    return { event, vitals: [systolic, diastolic], trend };
  }

  /** The owned vital series for a subject, optionally filtered to a type/context (for charts). */
  listSeries(subjectId: UUID, type?: VitalType, context?: VitalContext): Vital[] {
    const filter: Partial<Vital> = { subject_id: subjectId };
    if (type !== undefined) {
      filter.type = type;
    }
    if (context !== undefined) {
      filter.context = context;
    }
    return this.storage
      .query('Vital', filter)
      .sort((a, b) => Date.parse(a.measured_at) - Date.parse(b.measured_at));
  }
}
