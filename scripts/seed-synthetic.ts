/**
 * Synthetic-data seeder (docs/20-Implementation/205 Task 8; docs/10-Testing/130 BR-2).
 *
 * Generates a small, entirely fabricated family graph for dev/testing. It NEVER
 * contains real PHI — names and values are obviously synthetic. It emits JSON to
 * stdout (or a file passed as the first arg); wiring it into a dev spreadsheet is
 * done via the Sheets adapter in a dev context, not here.
 *
 * Usage: `pnpm seed:synthetic [outfile.json]`
 */

import { writeFileSync } from 'node:fs';

import type {
  ChildRecord,
  Event,
  Family,
  MaternalRecord,
  PregnancyEpisode,
  Vital,
} from '@wise-bloom/domain-types';

function id(prefix: string, n: number): string {
  return `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

export interface SyntheticDataset {
  families: Family[];
  maternalRecords: MaternalRecord[];
  pregnancyEpisodes: PregnancyEpisode[];
  childRecords: ChildRecord[];
  vitals: Vital[];
  events: Event[];
}

export function buildSyntheticDataset(): SyntheticDataset {
  const familyId = id('fam', 1);
  const ownerId = id('usr', 1);
  const maternalId = id('mat', 1);
  const episodeId = id('epi', 1);
  const childId = id('chd', 1);

  const family: Family = {
    family_id: familyId,
    owner_user_id: ownerId,
    created_at: '2026-01-05T08:00:00.000Z',
  };

  const maternal: MaternalRecord = {
    maternal_id: maternalId,
    family_id: familyId,
    profile: { name: 'Synthetic Mother A', dob: '1994-04-04', contact: 'synthetic@example.test' },
  };

  const episode: PregnancyEpisode = {
    episode_id: episodeId,
    maternal_id: maternalId,
    lmp: '2026-01-01',
    edd: '2026-10-08',
    pre_pregnancy_bmi_cat: 'under25',
    parity: 'nulliparous',
    status: 'delivered',
  };

  const child: ChildRecord = {
    child_id: childId,
    family_id: familyId,
    mother_id: maternalId,
    episode_id: episodeId,
    dob: '2026-10-02',
    sex: 'female',
    ga_at_birth_weeks: 39.4,
  };

  const vital: Vital = {
    vital_id: id('vit', 1),
    subject_id: maternalId,
    type: 'bp',
    value: 118,
    unit: 'mmHg',
    context: 'systolic',
    measured_at: '2026-03-10T09:15:00.000Z',
  };

  const events: Event[] = [
    {
      event_id: id('evt', 1),
      family_id: familyId,
      subject_id: maternalId,
      type: 'vital',
      life_stage: 'pregnancy',
      occurred_at: vital.measured_at,
      payload_ref: vital.vital_id,
      version: 1,
      created_by: ownerId,
    },
    {
      event_id: id('evt', 2),
      family_id: familyId,
      subject_id: childId,
      type: 'delivery',
      life_stage: 'delivery',
      occurred_at: '2026-10-02T04:20:00.000Z',
      version: 1,
      created_by: ownerId,
    },
  ];

  return {
    families: [family],
    maternalRecords: [maternal],
    pregnancyEpisodes: [episode],
    childRecords: [child],
    vitals: [vital],
    events,
  };
}

function main(): void {
  const dataset = buildSyntheticDataset();
  const json = JSON.stringify(dataset, null, 2);
  const outfile = process.argv[2];
  if (outfile) {
    writeFileSync(outfile, json, 'utf8');
    process.stdout.write(`Wrote synthetic dataset to ${outfile}\n`);
  } else {
    process.stdout.write(`${json}\n`);
  }
}

main();
