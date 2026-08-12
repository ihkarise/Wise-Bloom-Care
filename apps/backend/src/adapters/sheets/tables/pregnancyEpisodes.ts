/** `PregnancyEpisode` ↔ `pregnancy_episodes` tab mapping (docs/04-Architecture/54 §4, docs/05-Data/71 §5). */

import { f, type TableMapping } from './types';

export const PREGNANCY_EPISODE_TABLE: TableMapping = {
  entity: 'PregnancyEpisode',
  tab: 'pregnancy_episodes',
  pk: 'episode_id',
  appendOnly: false,
  immutableFields: [],
  fields: [
    f('episode_id', 'string'),
    f('maternal_id', 'string'),
    f('lmp', 'date', true),
    f('edd', 'date', true),
    f('pre_pregnancy_bmi_cat', 'string'),
    f('parity', 'string'),
    f('status', 'string'),
  ],
  foreignKeys: [{ field: 'maternal_id', references: 'MaternalRecord' }],
};
