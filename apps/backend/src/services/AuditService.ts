/**
 * AuditService — the single writer of the append-only audit log (docs/05-Data/75).
 *
 * Records *that* health data was accessed or changed, by whom, and when —
 * metadata only, never health content, secrets, or free-text PHI (75 BR-1/BR-2).
 * It writes through the StorageAdapter interface (never Sheets directly) and
 * emits a PHI-safe operational log line for traceability (docs/04-Architecture/63).
 */

import { newId } from '../lib/ids';

import type { Logger } from '../lib/logging';
import type { StorageAdapter } from '../adapters/StorageAdapter';
import type { ActorRole, AuditAction, AuditRecord, UUID } from '@wise-bloom/domain-types';

export interface AuditInput {
  actorUserId: UUID;
  actorRole: ActorRole;
  action: AuditAction;
  entity: string;
  entityId: UUID;
  familyId?: UUID;
  correlationId?: string;
  /** Safe, non-identifying context only (e.g., version number) — no health content. */
  meta?: Record<string, string | number | boolean>;
}

export class AuditService {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly logger: Logger,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  /** Append one audit record and emit a PHI-safe log line. */
  record(input: AuditInput): AuditRecord {
    const audit: AuditRecord = {
      audit_id: newId(),
      actor_user_id: input.actorUserId,
      actor_role: input.actorRole,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId,
      at: this.now(),
      ...(input.familyId !== undefined ? { family_id: input.familyId } : {}),
      ...(input.correlationId !== undefined ? { correlation_id: input.correlationId } : {}),
      ...(input.meta !== undefined ? { meta: input.meta } : {}),
    };

    const created = this.storage.create('AuditRecord', audit);

    // Operational log carries only allowlisted, non-PHI keys (docs/04-Architecture/63 §4).
    this.logger.info('audit', {
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId,
      actor_role: input.actorRole,
      user_id: input.actorUserId,
      ...(input.correlationId !== undefined ? { correlation_id: input.correlationId } : {}),
    });

    return created;
  }
}
