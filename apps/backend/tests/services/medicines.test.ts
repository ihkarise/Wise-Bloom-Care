/**
 * MedicinesService tests (docs/20-Implementation/208 §9 unit: medicine CRUD +
 * timeline emission; §6 Task 1: adding appends exactly one linked timeline
 * event; frozen domain model docs/05-Data/54 §4, docs/06-Modules/85 §8). Covers
 * add, list, edit, stop, history retention, validation, not-found, sanitisation.
 */

import { describe, expect, it } from 'vitest';

import { FamilyService } from '../../src/services/FamilyService';
import { MedicineNotFoundError, MedicinesService } from '../../src/services/MedicinesService';
import { TimelineService } from '../../src/services/TimelineService';
import { ValidationError } from '../../src/lib/validation';
import { createInMemoryAdapter } from '../support/inMemoryAdapter';

function setup(now: () => string = () => '2026-05-01T08:00:00.000Z') {
  const storage = createInMemoryAdapter();
  const family = new FamilyService(storage).createFamily('user-1');
  const timeline = new TimelineService(storage);
  const medicines = new MedicinesService(storage, timeline, now);
  return { storage, family, timeline, medicines };
}

const base = { subjectId: 'maternal-1', createdBy: 'user-1' };

describe('MedicinesService.add', () => {
  it('records a medicine and appends exactly one linked medicine timeline event', () => {
    const { storage, family, timeline, medicines } = setup();
    const result = medicines.add({
      ...base,
      familyId: family.family_id,
      name: 'Iron tablet',
      schedule: 'Every morning',
    });

    expect(result.medicine.name).toBe('Iron tablet');
    expect(result.medicine.schedule).toBe('Every morning');
    expect(result.medicine.active).toBe(true);
    expect(result.medicine.subject_id).toBe('maternal-1');
    expect(storage.get('Medicine', result.medicine.med_id)).not.toBeNull();

    expect(result.event.type).toBe('medicine');
    expect(result.event.payload_ref).toBe(result.medicine.med_id);
    expect(result.event.subject_id).toBe('maternal-1');
    expect(result.event.life_stage).toBe('pregnancy');
    expect(result.event.occurred_at).toBe('2026-05-01T08:00:00.000Z');
    expect(timeline.list(family.family_id).items).toHaveLength(1);
  });

  it('defaults active to true and respects an explicit active flag', () => {
    const { family, medicines } = setup();
    const stopped = medicines.add({
      ...base,
      familyId: family.family_id,
      name: 'Old supplement',
      schedule: 'As needed',
      active: false,
    });
    expect(stopped.medicine.active).toBe(false);
  });

  it('trims and requires a name', () => {
    const { family, medicines } = setup();
    expect(() =>
      medicines.add({ ...base, familyId: family.family_id, name: '   ', schedule: 'Daily' }),
    ).toThrow(ValidationError);
  });

  it('requires a schedule', () => {
    const { family, medicines } = setup();
    expect(() =>
      medicines.add({ ...base, familyId: family.family_id, name: 'Folic acid', schedule: '' }),
    ).toThrow(ValidationError);
  });

  it('rejects a name longer than the length bound', () => {
    const { family, medicines } = setup();
    expect(() =>
      medicines.add({
        ...base,
        familyId: family.family_id,
        name: 'x'.repeat(201),
        schedule: 'Daily',
      }),
    ).toThrow(ValidationError);
  });

  it('neutralises spreadsheet formula injection in free text (docs/05-Data/73 §8)', () => {
    const { medicines, family } = setup();
    const result = medicines.add({
      ...base,
      familyId: family.family_id,
      name: '=HYPERLINK("http://evil","clickme")',
      schedule: 'Every morning',
    });
    // Leading '=' is prefixed with an apostrophe so Sheets treats it as text.
    expect(result.medicine.name.startsWith("'=")).toBe(true);
  });
});

describe('MedicinesService.update', () => {
  it('edits name and schedule in place, keeping one timeline entry', () => {
    const { family, timeline, medicines } = setup();
    const created = medicines.add({
      ...base,
      familyId: family.family_id,
      name: 'Iron',
      schedule: 'Morning',
    });

    const updated = medicines.update({
      medId: created.medicine.med_id,
      name: 'Iron tablet',
      schedule: 'Twice daily with food',
    });

    expect(updated.name).toBe('Iron tablet');
    expect(updated.schedule).toBe('Twice daily with food');
    expect(medicines.get(created.medicine.med_id).name).toBe('Iron tablet');
    // Editing never adds a second medicine event.
    expect(timeline.list(family.family_id).items).toHaveLength(1);
  });

  it('stops a medicine (active=false) and preserves the record and history', () => {
    const { family, timeline, medicines } = setup();
    const created = medicines.add({
      ...base,
      familyId: family.family_id,
      name: 'Iron tablet',
      schedule: 'Every morning',
    });

    const stopped = medicines.update({ medId: created.medicine.med_id, active: false });
    expect(stopped.active).toBe(false);
    // The record is never hard-deleted — it stays in history.
    expect(medicines.get(created.medicine.med_id)).not.toBeNull();
    expect(medicines.get(created.medicine.med_id).name).toBe('Iron tablet');
    // Stopping adds no second timeline entry.
    expect(timeline.list(family.family_id).items).toHaveLength(1);
  });

  it('can restart a stopped medicine', () => {
    const { family, medicines } = setup();
    const created = medicines.add({
      ...base,
      familyId: family.family_id,
      name: 'Iron tablet',
      schedule: 'Every morning',
      active: false,
    });
    const restarted = medicines.update({ medId: created.medicine.med_id, active: true });
    expect(restarted.active).toBe(true);
  });

  it('rejects an update with no changes', () => {
    const { family, medicines } = setup();
    const created = medicines.add({
      ...base,
      familyId: family.family_id,
      name: 'Iron tablet',
      schedule: 'Every morning',
    });
    expect(() => medicines.update({ medId: created.medicine.med_id })).toThrow(ValidationError);
  });

  it('rejects clearing the name to empty', () => {
    const { family, medicines } = setup();
    const created = medicines.add({
      ...base,
      familyId: family.family_id,
      name: 'Iron tablet',
      schedule: 'Every morning',
    });
    expect(() => medicines.update({ medId: created.medicine.med_id, name: '  ' })).toThrow(
      ValidationError,
    );
  });

  it('throws for an unknown medicine id', () => {
    const { medicines } = setup();
    expect(() => medicines.update({ medId: 'missing', active: false })).toThrow(
      MedicineNotFoundError,
    );
  });
});

describe('MedicinesService.get', () => {
  it('throws MedicineNotFoundError for an unknown id', () => {
    const { medicines } = setup();
    expect(() => medicines.get('nope')).toThrow(MedicineNotFoundError);
  });
});

describe('MedicinesService.list', () => {
  it('returns active medicines first, then stopped, each ordered by name', () => {
    const { family, medicines } = setup();
    medicines.add({
      ...base,
      familyId: family.family_id,
      name: 'Zinc',
      schedule: 'Daily',
    });
    medicines.add({
      ...base,
      familyId: family.family_id,
      name: 'Calcium',
      schedule: 'Daily',
    });
    const stopped = medicines.add({
      ...base,
      familyId: family.family_id,
      name: 'Aspirin',
      schedule: 'Daily',
    });
    medicines.update({ medId: stopped.medicine.med_id, active: false });

    const list = medicines.list('maternal-1');
    expect(list.map((m) => m.name)).toEqual(['Calcium', 'Zinc', 'Aspirin']);
    expect(list.map((m) => m.active)).toEqual([true, true, false]);
  });

  it('scopes to the requested subject', () => {
    const { family, medicines } = setup();
    medicines.add({ ...base, familyId: family.family_id, name: 'Iron', schedule: 'Daily' });
    expect(medicines.list('maternal-1')).toHaveLength(1);
    expect(medicines.list('another-subject')).toHaveLength(0);
  });
});
