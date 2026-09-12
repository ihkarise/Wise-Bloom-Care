/**
 * AppointmentsService tests (docs/20-Implementation/208 §9 unit: appointment
 * CRUD + timeline emission; MS-1.4 "the visit is recorded on the timeline").
 */

import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../src/lib/validation';
import {
  AppointmentNotFoundError,
  AppointmentsService,
} from '../../src/services/AppointmentsService';
import { FamilyService } from '../../src/services/FamilyService';
import { TimelineService } from '../../src/services/TimelineService';
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
  it('persists an appointment and appends an appointment timeline event', () => {
    const { storage, family, timeline, appointments } = setup();
    const result = appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: '2026-10-01T09:00:00.000Z',
    });

    expect(result.appointment.status).toBe('scheduled');
    expect(storage.get('Appointment', result.appointment.appt_id)).not.toBeNull();
    expect(result.event.type).toBe('appointment');
    expect(timeline.list(family.family_id).items).toHaveLength(1);
  });

  it('allows a future scheduled_at — an appointment is a plan, not a measurement', () => {
    const { appointments, family } = setup();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const result = appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: future,
    });
    expect(result.appointment.scheduled_at).toBe(future);
  });

  it('records a past visit with an explicit status', () => {
    const { appointments, family } = setup();
    const result = appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: '2026-01-05T10:00:00.000Z',
      status: 'completed',
    });
    expect(result.appointment.status).toBe('completed');
  });

  it('rejects an invalid scheduled_at', () => {
    const { appointments, family } = setup();
    expect(() =>
      appointments.schedule({ ...base, familyId: family.family_id, scheduledAt: 'not-a-date' }),
    ).toThrow(ValidationError);
  });

  it('rejects an unknown status', () => {
    const { appointments, family } = setup();
    expect(() =>
      appointments.schedule({
        ...base,
        familyId: family.family_id,
        scheduledAt: '2026-10-01T09:00:00.000Z',
        status: 'rescheduled' as never,
      }),
    ).toThrow(ValidationError);
  });
});

describe('AppointmentsService.list', () => {
  it('returns appointments for the subject, soonest first', () => {
    const { appointments, family } = setup();
    appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: '2026-10-10T09:00:00.000Z',
    });
    appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: '2026-10-01T09:00:00.000Z',
    });
    const list = appointments.list('maternal-1');
    expect(list.map((a) => a.scheduled_at)).toEqual([
      '2026-10-01T09:00:00.000Z',
      '2026-10-10T09:00:00.000Z',
    ]);
  });
});

describe('AppointmentsService.updateStatus', () => {
  it('marks an appointment completed', () => {
    const { appointments, family } = setup();
    const created = appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: '2026-10-01T09:00:00.000Z',
    });
    const updated = appointments.updateStatus(
      created.appointment.appt_id,
      'maternal-1',
      'completed',
    );
    expect(updated.status).toBe('completed');
  });

  it('rejects an invalid status', () => {
    const { appointments, family } = setup();
    const created = appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: '2026-10-01T09:00:00.000Z',
    });
    expect(() =>
      appointments.updateStatus(created.appointment.appt_id, 'maternal-1', 'done'),
    ).toThrow(ValidationError);
  });

  it('refuses to update an appointment belonging to another subject (fail closed)', () => {
    const { appointments, family } = setup();
    const created = appointments.schedule({
      ...base,
      familyId: family.family_id,
      scheduledAt: '2026-10-01T09:00:00.000Z',
    });
    expect(() =>
      appointments.updateStatus(created.appointment.appt_id, 'someone-else', 'completed'),
    ).toThrow(AppointmentNotFoundError);
  });

  it('throws for an unknown appointment id', () => {
    const { appointments } = setup();
    expect(() => appointments.updateStatus('missing', 'maternal-1', 'completed')).toThrow(
      AppointmentNotFoundError,
    );
  });
});
