/**
 * Client domain types (docs/04-Architecture/51 §6).
 *
 * The client's source of truth for shapes is the shared contract package; this
 * module re-exports it so features import from `../domain` and never duplicate
 * business rules that belong server-side (51 BR-3, P5).
 */
export * from '@wise-bloom/domain-types';
