/**
 * AppointmentsService — schedule/record pregnancy visits and turn them into
 * timeline events (docs/06-Modules/95, docs/08-Timeline/110,
 * docs/20-Implementation/208 §6 Task 1).
 *
 * Every schedule: validate (structural, docs/05-Data/73), persist the
 * Appointment through the StorageAdapter, and append one `appointment` timeline
 * event linked back to the appointment via `payload_ref` so the visit is part
 * of the one continuous record (docs/04-Architecture/56 §5, docs/05-Data/71 §3).
 * A visit's outcome is recorded by moving its status (scheduled → completed /
 * cancelled / missed); the timeline keeps a single entry per appointment — the
 * status lives on the Appointment record, never duplicated as timeline noise.
 *
 * Unlike a vital or a report, an appointment's time may be in the FUTURE — that
 * is the whole point of scheduling — so `scheduled_at` is not held to the
 * not-in-the-future rule that past measurements are (docs/05-Data/73 §6).
 *
 * The appointment scaffold is context only; the clinician owns the plan
 * (docs/06-Modules/82 FR-5, docs/08-Timeline/110). This service records the
 * family's own appointments and interprets nothing clinically.
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

/** Closed set of appointment statuses (docs/05-Data/72 §8, frozen domain model). */
const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = [
  'scheduled',
  'completed',
  'cancelled',
  'missed',
];

export function isAppointmentStatus(value: unknown): value is AppointmentStatus {
  return typeof value === 'string' && APPOINTMENT_STATUSES.includes(value as AppointmentStatus);
}

export class AppointmentNotFoundError extends Error {
  override readonly name = 'AppointmentNotFoundError';
}

export interface ScheduleAppointmentInput {
  familyId: UUID;
  subjectId: UUID;
  createdBy: UUID;
  scheduledAt: ISODateTime;
  /** Defaults to `scheduled`; a past visit can be recorded directly as `completed`. */
  status?: AppointmentStatus;
  /** Life stage of the record the appointment belongs to; pregnancy-scoped in v1 (default). */
  lifeStage?: LifeStage;
}

export interface ScheduleAppointmentResult {
  event: Event;
  appointment: Appointment;
}

export interface UpdateAppointmentStatusInput {
  apptId: UUID;
  status: AppointmentStatus;
}

export class AppointmentsService {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly timeline: TimelineService,
  ) {}

  /** Schedules (or records) an appointment + appends a linked `appointment` timeline event. */
  schedule(input: ScheduleAppointmentInput): ScheduleAppointmentResult {
    if (!isIsoDateTime(input.scheduledAt)) {
      throw new ValidationError('scheduled_at must be an ISO 8601 UTC datetime');
    }
    const status = input.status ?? 'scheduled';
    if (!isAppointmentStatus(status)) {
      throw new ValidationError('status must be one of scheduled, completed, cancelled, missed');
    }

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
      payloadRef: created.appt_id,
    });

    return { event, appointment: created };
  }

  /** Records a visit's outcome by moving its status (scheduled → completed/cancelled/missed). */
  updateStatus(input: UpdateAppointmentStatusInput): Appointment {
    if (!isAppointmentStatus(input.status)) {
      throw new ValidationError('status must be one of scheduled, completed, cancelled, missed');
    }
    const existing = this.get(input.apptId);
    return this.storage.update('Appointment', existing.appt_id, { status: input.status });
  }

  /** A single appointment, or throws `AppointmentNotFoundError`. */
  get(apptId: UUID): Appointment {
    const appointment = this.storage.get('Appointment', apptId);
    if (!appointment) {
      throw new AppointmentNotFoundError(`Appointment ${apptId} not found`);
    }
    return appointment;
  }

  /** The family's appointments, ordered chronologically by when they are scheduled. */
  list(familyId: UUID): Appointment[] {
    return this.storage
      .query('Appointment', { family_id: familyId })
      .sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at));
  }
}
