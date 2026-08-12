/**
 * DashboardService — the home read model (docs/06-Modules/81,
 * docs/20-Implementation/207 Task 5). Pure aggregation: it reads across other
 * modules *through their services and the storage query interface* and writes
 * NOTHING — the dashboard owns no domain data (81 §1, docs/00-Vision/13 BR-1).
 * Every tile is surfacing-only and calm; no diagnosis (81 BR-2).
 */

import type { TrendService } from './TrendService';
import type { TimelineService } from './TimelineService';
import type { MaternalService } from './MaternalService';
import type { PregnancyService } from './PregnancyService';
import type { StorageAdapter } from '../adapters/StorageAdapter';
import type {
  DashboardMetric,
  DashboardStatus,
  DashboardSummary,
  ISODate,
  UUID,
  Vital,
} from '@wise-bloom/domain-types';

/** How many recent timeline events to preview on the dashboard (81 FR-5). */
const RECENT_TIMELINE_LIMIT = 5;

export interface DashboardServiceDeps {
  storage: StorageAdapter;
  timeline: TimelineService;
  trend: TrendService;
  maternal: MaternalService;
  pregnancy: PregnancyService;
}

export class DashboardService {
  constructor(
    private readonly deps: DashboardServiceDeps,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  /** Assembles the dashboard read model for a family as of `asOf` (default today). */
  build(familyId: UUID, asOf: ISODate): DashboardSummary {
    const maternal = this.deps.maternal.findByFamily(familyId);
    const status = this.buildStatus(maternal?.family_id ? maternal.maternal_id : null, asOf);

    const vitals: Vital[] = maternal
      ? this.deps.storage.query('Vital', { subject_id: maternal.maternal_id })
      : [];

    const metrics = this.buildMetrics(vitals);
    const bp = this.deps.trend.computeBloodPressureTrend(vitals);
    const hasBp = bp.systolic.sampleCount > 0 || bp.diastolic.sampleCount > 0;

    return {
      family_id: familyId,
      generated_at: this.now(),
      status,
      metrics,
      ...(hasBp ? { blood_pressure: bp } : {}),
      recent_timeline: this.deps.timeline.recent(familyId, RECENT_TIMELINE_LIMIT),
    };
  }

  /** Life-stage status header (81 FR-1). Sprint 02 is pregnancy-scoped; weeks when LMP is known. */
  private buildStatus(maternalId: UUID | null, asOf: ISODate): DashboardStatus {
    if (!maternalId) {
      return { life_stage: 'pregnancy' };
    }
    const active = this.deps.pregnancy
      .listEpisodes(maternalId)
      .find((episode) => episode.status === 'active');
    if (!active) {
      return { life_stage: 'pregnancy' };
    }
    const ga = this.deps.pregnancy.gestationalAge(active, asOf);
    return {
      life_stage: 'pregnancy',
      ...(ga ? { pregnancy_weeks: ga.weeks } : {}),
    };
  }

  /** Single-value metric tiles (weight, blood sugar) — only when data exists (no faked trends, 81 §10). */
  private buildMetrics(vitals: Vital[]): DashboardMetric[] {
    const metrics: DashboardMetric[] = [];

    const weight = this.deps.trend.computeTrend(vitals, 'weight', 'kg');
    if (weight.sampleCount > 0) {
      metrics.push({ vital_type: 'weight', label: 'Weight', trend: weight });
    }

    const bloodSugar = this.deps.trend.computeTrend(vitals, 'blood_sugar', 'mg/dL');
    if (bloodSugar.sampleCount > 0) {
      metrics.push({ vital_type: 'blood_sugar', label: 'Blood sugar', trend: bloodSugar });
    }

    return metrics;
  }
}
