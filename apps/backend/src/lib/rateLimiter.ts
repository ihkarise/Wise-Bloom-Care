/**
 * Rate limiting (docs/09-Security/120 §5 T1, docs/04-Architecture/57 BR mention
 * of rate-limited register/login).
 *
 * A storage-neutral interface, mirroring the StorageAdapter boundary pattern:
 * services depend on `RateLimiter`, not on a concrete counter store. The
 * in-memory sliding-window implementation below is correct for a single
 * warm GAS execution context and for tests; production hardening (counters
 * shared across GAS executions via `CacheService`) is a drop-in
 * implementation behind the same interface (documented as technical debt in
 * the Sprint 01 completion report — GAS does not guarantee memory persists
 * across invocations the way a long-lived server process would).
 */

export interface RateLimiter {
  /** Records one attempt under `key`; returns `false` when the budget for the current window is exhausted. */
  consume(key: string): boolean;
}

export interface RateLimiterOptions {
  /** Maximum attempts allowed per key within `windowMs`. */
  limit: number;
  windowMs: number;
  now?: () => number;
}

export function createInMemoryRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { limit, windowMs, now = () => Date.now() } = options;
  const hits = new Map<string, number[]>();

  return {
    consume(key: string): boolean {
      const t = now();
      const windowStart = t - windowMs;
      const recent = (hits.get(key) ?? []).filter((timestamp) => timestamp > windowStart);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(t);
      hits.set(key, recent);
      return true;
    },
  };
}
