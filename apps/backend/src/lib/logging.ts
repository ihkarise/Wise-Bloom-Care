/**
 * Structured, PHI-safe operational logging (docs/04-Architecture/63).
 *
 * Hard rule (63 §5, BR-1): operational logs never contain PHI, secrets, or
 * payload contents. This logger enforces that structurally with a **safe-key
 * allowlist** — any context key not on the list is dropped and only its *name*
 * is recorded under `redacted_keys`, so a careless caller cannot leak a value.
 * The audit trail of *who accessed what* lives in the AuditService, not here
 * (docs/05-Data/75).
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Keys permitted in operational log context. Deliberately narrow — request
 * metadata only, never health values, names, DOBs, or free text (63 §4/§5).
 */
export const SAFE_CONTEXT_KEYS = [
  'endpoint',
  'method',
  'status',
  'latency_ms',
  'correlation_id',
  'user_id',
  'actor_role',
  'environment',
  'entity',
  'entity_id',
  'action',
  'version',
  'code',
] as const;

export type SafeContextKey = (typeof SAFE_CONTEXT_KEYS)[number];

export type LogContext = Partial<Record<SafeContextKey, string | number | boolean>> &
  Record<string, unknown>;

export interface LogEntry {
  level: LogLevel;
  message: string;
  time: string;
  context: Partial<Record<SafeContextKey, string | number | boolean>>;
  redacted_keys?: string[];
}

const SAFE_KEY_SET = new Set<string>(SAFE_CONTEXT_KEYS);

/** Splits caller context into the allowlisted subset and the redacted key names. */
export function stripPhi(context: LogContext | undefined): {
  safe: Partial<Record<SafeContextKey, string | number | boolean>>;
  redactedKeys: string[];
} {
  const safe: Partial<Record<SafeContextKey, string | number | boolean>> = {};
  const redactedKeys: string[] = [];
  if (!context) {
    return { safe, redactedKeys };
  }
  for (const [key, value] of Object.entries(context)) {
    if (
      SAFE_KEY_SET.has(key) &&
      (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    ) {
      safe[key as SafeContextKey] = value;
    } else {
      redactedKeys.push(key);
    }
  }
  return { safe, redactedKeys };
}

/** Sink for log entries. Defaults to the runtime console (GAS/host logs). */
export type LogSink = (entry: LogEntry) => void;

const defaultSink: LogSink = (entry) => {
  console.log(JSON.stringify(entry));
};

export interface Logger {
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

export interface LoggerOptions {
  /** Debug is disabled in production (63 BR-4). */
  debugEnabled?: boolean;
  sink?: LogSink;
  now?: () => string;
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const sink = options.sink ?? defaultSink;
  const now = options.now ?? (() => new Date().toISOString());
  const debugEnabled = options.debugEnabled ?? false;

  function emit(level: LogLevel, message: string, context?: LogContext): void {
    if (level === 'debug' && !debugEnabled) {
      return;
    }
    const { safe, redactedKeys } = stripPhi(context);
    const entry: LogEntry = { level, message, time: now(), context: safe };
    if (redactedKeys.length > 0) {
      entry.redacted_keys = redactedKeys;
    }
    sink(entry);
  }

  return {
    error: (message, context) => emit('error', message, context),
    warn: (message, context) => emit('warn', message, context),
    info: (message, context) => emit('info', message, context),
    debug: (message, context) => emit('debug', message, context),
  };
}
