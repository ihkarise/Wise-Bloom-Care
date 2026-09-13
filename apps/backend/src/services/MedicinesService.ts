/**
 * MedicinesService — record the medicines/supplements a mother is taking and
 * keep them on the one continuous timeline (docs/06-Modules/85,
 * docs/08-Timeline/110, docs/20-Implementation/208 §6 Task 1).
 *
 * The app **records and reminds; it never prescribes, doses, interacts, or
 * advises** (docs/06-Modules/85 BR-1/BR-2). Every add: validate (structural,
 * docs/05-Data/73), persist the Medicine through the StorageAdapter, and append
 * exactly ONE `medicine` timeline event linked back via `payload_ref` so the
 * medicine is part of the family record (docs/05-Data/71 §3). Editing a
 * medicine or stopping it (`active: false`) updates the record in place — the
 * timeline keeps a single entry per medicine (no per-edit noise, mirroring
 * AppointmentsService); history is preserved by never hard-deleting the row and
 * by the append-only event (docs/06-Modules/85 §10, FR-4).
 *
 * The frozen field set is exact — `med_id, subject_id, name, schedule, active` —
 * with no `notes` and no invented fields (docs/06-Modules/85 §8, docs/05-Data/54
 * §4). `schedule` is a free-text string (e.g. "Every morning"); no structured
 * scheduling format is defined (docs/05-Data/72), so none is invented here.
 *
 * A Medicine carries `subject_id` but no `family_id`; the family is supplied by
 * the caller (the controller, after fail-closed RBAC) solely to place the
 * timeline event on the right family stream — it is never stored on the medicine.
 */

import { newId } from '../lib/ids';
import { sanitizeString, ValidationError } from '../lib/validation';

import type { TimelineService } from './TimelineService';
import type { StorageAdapter } from '../adapters/StorageAdapter';
import type { Event, LifeStage, Medicine, UUID } from '@wise-bloom/domain-types';

/** Free-text field length caps (docs/05-Data/73 §4 "string length bounds"). */
const NAME_MAX_LENGTH = 200;
const SCHEDULE_MAX_LENGTH = 200;

export class MedicineNotFoundError extends Error {
  override readonly name = 'MedicineNotFoundError';
}

export interface AddMedicineInput {
  /** For the timeline event only — never stored on the Medicine (it has no family_id). */
  familyId: UUID;
  /** The maternal record the medicine belongs to; stored as `medicine.subject_id`. */
  subjectId: UUID;
  createdBy: UUID;
  name: string;
  schedule: string;
  /** Defaults to `true` — a medicine is active when first added. */
  active?: boolean;
  /** Life stage of the record the medicine belongs to; pregnancy-scoped in v1 (default). */
  lifeStage?: LifeStage;
}

export interface AddMedicineResult {
  event: Event;
  medicine: Medicine;
}

export interface UpdateMedicineInput {
  medId: UUID;
  name?: string;
  schedule?: string;
  active?: boolean;
}

/**
 * Trims, requires, length-bounds, and formula-injection-sanitises a free-text
 * field (docs/05-Data/73 §4/§8). Mirrors ReportsService's handling of free text;
 * the adapter also sanitises on write (defence in depth).
 */
function cleanRequiredText(raw: unknown, field: string, maxLength: number): string {
  if (typeof raw !== 'string') {
    throw new ValidationError(`Missing required field: ${field}`);
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(`Missing required field: ${field}`);
  }
  if (trimmed.length > maxLength) {
    throw new ValidationError(`${field} must be ${maxLength} characters or fewer`);
  }
  return sanitizeString(trimmed);
}

export class MedicinesService {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly timeline: TimelineService,
    /** Injected for testability; the "added" moment for the timeline event. */
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  /** Records a medicine + appends exactly one linked `medicine` timeline event. */
  add(input: AddMedicineInput): AddMedicineResult {
    const name = cleanRequiredText(input.name, 'name', NAME_MAX_LENGTH);
    const schedule = cleanRequiredText(input.schedule, 'schedule', SCHEDULE_MAX_LENGTH);

    const medicine: Medicine = {
      med_id: newId(),
      subject_id: input.subjectId,
      name,
      schedule,
      active: input.active ?? true,
    };
    const created = this.storage.create('Medicine', medicine);

    const event = this.timeline.append({
      familyId: input.familyId,
      subjectId: input.subjectId,
      type: 'medicine',
      lifeStage: input.lifeStage ?? 'pregnancy',
      // A medicine has no clock field; the event marks when it was added to the record.
      occurredAt: this.now(),
      createdBy: input.createdBy,
      payloadRef: created.med_id,
    });

    return { event, medicine: created };
  }

  /**
   * Edits a medicine's `name`/`schedule` and/or stops/restarts it (`active`).
   * Updates the record in place (versioned-update semantics — the medicines
   * table is correctable, not append-only); adds no timeline event. At least
   * one changeable field must be supplied.
   */
  update(input: UpdateMedicineInput): Medicine {
    const existing = this.get(input.medId);

    const changes: Partial<Medicine> = {};
    if (input.name !== undefined) {
      changes.name = cleanRequiredText(input.name, 'name', NAME_MAX_LENGTH);
    }
    if (input.schedule !== undefined) {
      changes.schedule = cleanRequiredText(input.schedule, 'schedule', SCHEDULE_MAX_LENGTH);
    }
    if (input.active !== undefined) {
      if (typeof input.active !== 'boolean') {
        throw new ValidationError('active must be a boolean');
      }
      changes.active = input.active;
    }
    if (Object.keys(changes).length === 0) {
      throw new ValidationError('No changes provided');
    }

    return this.storage.update('Medicine', existing.med_id, changes);
  }

  /** A single medicine, or throws `MedicineNotFoundError`. */
  get(medId: UUID): Medicine {
    const medicine = this.storage.get('Medicine', medId);
    if (!medicine) {
      throw new MedicineNotFoundError(`Medicine ${medId} not found`);
    }
    return medicine;
  }

  /**
   * A subject's medicines: active first (the current in-app reminders), then
   * stopped ones (history), each ordered by name for a stable, calm list.
   */
  list(subjectId: UUID): Medicine[] {
    return this.storage.query('Medicine', { subject_id: subjectId }).sort((a, b) => {
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }
}
