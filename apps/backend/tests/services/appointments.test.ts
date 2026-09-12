/**
 * AppointmentsService tests (docs/20-Implementation/208 §9 unit: appointment
 * CRUD + timeline emission; §6 Task 1: scheduling appends a linked timeline
 * event; frozen domain model docs/05-Data/72 §8 status enum).
 */

import { describe, expect, it } from 'vitest';

import {
  AppointmentNotFoundError,
  AppointmentsService,
  isAppointmentStatus,
} from '../../src/services/AppointmentsService';
import { TimelineService } from '../../src/services/TimelineService';
import { ValidationError } from '../../src/lib/validation';
import { FamilyService } from '../../src/services/FamilyService';
import { createInMemoryAdapter } from '../support/inMemoryAdapter';

function setup() {
  const storage = createInMemoryAdapter();
  const family = new FamilyService(storage).createFamily('user-1');
  const timeline = new TimelineService(storage);
  const appointments = new AppointmentsService(storage, timeline);
  return { storage, family, timeline, appointments };
}

const base = { subjectId: 'maternal-1', createdBy: 'user-1' };

describe('AppointmentsService.schedule', () => {
  it('creates an appointment and appends a linked appointment timeline event', () => {
    const { storage, family, timeline, appointments } = setup();
    const result = appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: '2026-04-01T09:30:00.000Z',
    });

    expect(result.appointment.status).toBe('scheduled');
    expect(result.appointment.family_id).toBe(family.family_id);
    expect(storage.get('Appointment', result.appointment.appt_id)).not.toBeNull();

    expect(result.event.type).toBe('appointment');
    // The event links back to the appointment record (one continuous record).
    expect(result.event.payload_ref).toBe(result.appointment.appt_id);
    expect(result.event.occurred_at).toBe('2026-04-01T09:30:00.000Z');
    expect(timeline.list(family.family_id).items).toHaveLength(1);
  });

  it('allows a future scheduled_at (scheduling ahead is the point)', () => {
    const { family, appointments } = setup();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const result = appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: future,
    });
    expect(result.appointment.scheduled_at).toBe(future);
  });

  it('can record a past visit directly as completed', () => {
    const { family, appointments } = setup();
    const result = appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: '2026-01-10T10:00:00.000Z',
      status: 'completed',
    });
    expect(result.appointment.status).toBe('completed');
  });

  it('rejects a non-ISO scheduled_at', () => {
    const { family, appointments } = setup();
    expect(() =>
      appointments.schedule({ ...base, familyId: family.family_id, scheduledAt: 'next tuesday' }),
    ).toThrow(ValidationError);
  });

  it('rejects an unknown status', () => {
    const { family, appointments } = setup();
    expect(() =>
      appointments.schedule({
        ...base,
        familyId: family.family_id,
        scheduledAt: '2026-04-01T09:30:00.000Z',
        status: 'rescheduled' as never,
      }),
    ).toThrow(ValidationError);
  });
});

describe('AppointmentsService.updateStatus', () => {
  it('moves a scheduled appointment to a recorded outcome', () => {
    const { family, appointments } = setup();
    const created = appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: '2026-04-01T09:30:00.000Z',
    });
    const updated = appointments.updateStatus({
      apptId: created.appointment.appt_id,
      status: 'completed',
    });
    expect(updated.status).toBe('completed');
    expect(appointments.get(created.appointment.appt_id).status).toBe('completed');
  });

  it('does not add a second timeline event when status changes', () => {
    const { family, timeline, appointments } = setup();
    const created = appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: '2026-04-01T09:30:00.000Z',
    });
    appointments.updateStatus({ apptId: created.appointment.appt_id, status: 'missed' });
    expect(timeline.list(family.family_id).items).toHaveLength(1);
  });

  it('rejects an unknown status', () => {
    const { family, appointments } = setup();
    const created = appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: '2026-04-01T09:30:00.000Z',
    });
    expect(() =>
      appointments.updateStatus({
        apptId: created.appointment.appt_id,
        status: 'done' as never,
      }),
    ).toThrow(ValidationError);
  });

  it('throws for an unknown appointment id', () => {
    const { appointments } = setup();
    expect(() => appointments.updateStatus({ apptId: 'missing', status: 'completed' })).toThrow(
      AppointmentNotFoundError,
    );
  });
});

describe('AppointmentsService.list', () => {
  it('returns the family appointments ordered chronologically', () => {
    const { family, appointments } = setup();
    appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: '2026-05-01T09:00:00.000Z',
    });
    appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: '2026-03-01T09:00:00.000Z',
    });
    const list = appointments.list(family.family_id);
    expect(list.map((a) => a.scheduled_at)).toEqual([
      '2026-03-01T09:00:00.000Z',
      '2026-05-01T09:00:00.000Z',
    ]);
  });
});

describe('isAppointmentStatus', () => {
  it('accepts only the closed set', () => {
    expect(isAppointmentStatus('scheduled')).toBe(true);
    expect(isAppointmentStatus('completed')).toBe(true);
    expect(isAppointmentStatus('cancelled')).toBe(true);
    expect(isAppointmentStatus('missed')).toBe(true);
    expect(isAppointmentStatus('pending')).toBe(false);
    expect(isAppointmentStatus(42)).toBe(false);
  });
});
