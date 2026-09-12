/**
 * AppointmentsService — schedule/record antenatal visits and surface them on
 * the continuous timeline (docs/06-Modules/85, docs/20-Implementation/208
 * Task 1, MS-1.4).
 *
 * Every scheduling: validate (structural, docs/05-Data/73), persist the
 * Appointment through the StorageAdapter, and append an `appointment` timeline
 * event (docs/04-Architecture/56 §5) at the visit's time — so the visit is
 * part of the one continuous record (docs/08-Timeline/110). Unlike a vital, an
 * appointment is a *plan*: `scheduled_at` may be in the future, so no
 * not-in-the-future guard applies here.
 *
 * The record is intentionally minimal (frozen schema, docs/04-Architecture/55
 * §Appointment): id, family, subject, when, status. Status transitions
 * (completed/cancelled/missed) update the record in place; the timeline event
 * that anchors the visit is never rewritten.
 */

import { newId } from '../lib/ids';
import { isIsoDateTime, ValidationError } from '../lib/validation';

import type { TimelineService } from './TimelineService';
import type { StorageAdapter } from '../adapters/StorageAdapter';
import type {
  Appointment,
  AppointmentStatus,
  Event,
  ISODateTime,
  LifeStage,
  UUID,
} from '@wise-bloom/domain-types';

/** The closed set of appointment statuses (docs/05-Data/72 §appointments). */
const VALID_STATUSES: readonly AppointmentStatus[] = [
  'scheduled',
  'completed',
  'cancelled',
  'missed',
];

export interface ScheduleAppointmentInput {
  familyId: UUID;
  subjectId: UUID;
  createdBy: UUID;
  scheduledAt: ISODateTime;
  /** Defaults to `scheduled` — the common case of planning a future visit. */
  status?: AppointmentStatus;
  /** Life stage of the record the appointment belongs to; pregnancy in Sprint 03 (default). */
  lifeStage?: LifeStage;
}

export interface ScheduleAppointmentResult {
  event: Event;
  appointment: Appointment;
}

/** Raised when an appointment is looked up but does not exist / is out of the caller's scope. */
export class AppointmentNotFoundError extends Error {
  override readonly name = 'AppointmentNotFoundError';
}

function assertStatus(status: string): asserts status is AppointmentStatus {
  if (!VALID_STATUSES.includes(status as AppointmentStatus)) {
    throw new ValidationError(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
}

export class AppointmentsService {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly timeline: TimelineService,
  ) {}

  /** Schedules (future) or records (past) a visit and appends its timeline event. */
  schedule(input: ScheduleAppointmentInput): ScheduleAppointmentResult {
    if (!isIsoDateTime(input.scheduledAt)) {
      throw new ValidationError('scheduled_at must be an ISO 8601 UTC datetime');
    }
    const status = input.status ?? 'scheduled';
    assertStatus(status);

    const appointment: Appointment = {
      appt_id: newId(),
      family_id: input.familyId,
      subject_id: input.subjectId,
      scheduled_at: input.scheduledAt,
      status,
    };
    const created = this.storage.create('Appointment', appointment);

    const event = this.timeline.append({
      familyId: input.familyId,
      subjectId: input.subjectId,
      type: 'appointment',
      lifeStage: input.lifeStage ?? 'pregnancy',
      occurredAt: input.scheduledAt,
      createdBy: input.createdBy,
    });

    return { event, appointment: created };
  }

  /** The appointments for a subject, ordered soonest-first by `scheduled_at`. */
  list(subjectId: UUID): Appointment[] {
    return this.storage
      .query('Appointment', { subject_id: subjectId })
      .sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at));
  }

  /**
   * Updates an appointment's status. Scoped to `subjectId`: an appointment
   * belonging to another subject is reported as not-found, so a caller can
   * never touch a record outside their family (fail closed,
   * docs/04-Architecture/52 §8).
   */
  updateStatus(apptId: UUID, subjectId: UUID, status: string): Appointment {
    assertStatus(status);
    const existing = this.storage.get('Appointment', apptId);
    if (!existing || existing.subject_id !== subjectId) {
      throw new AppointmentNotFoundError(`Appointment ${apptId} not found`);
    }
    return this.storage.update('Appointment', apptId, { status });
  }
}
