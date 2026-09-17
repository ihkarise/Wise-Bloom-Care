/**
 * CountRecorder — one-tap recording for a `count`-type tracker (docs/03-UX/42
 * §7, docs/06-Modules/98 §8). Each tap appends exactly one new `TrackerEntry`
 * (value `"1"`); the number shown is the **sum of today's entries**, not a
 * mutable cell (98 §16 edge cases: "today's value is a view over the day's
 * entries"). There is deliberately no decrement control: `TrackerEntry` is
 * append-only and never edited or deleted (98 BR-3, `ADR-007`), so there is
 * nothing a "−" tap could honestly do — a mis-tap is corrected by recording a
 * fresh, separate observation, the same way every other value type works
 * here, not by silently retracting history.
 */
import { type ReactElement } from 'react';

export interface CountRecorderProps {
  label: string;
  /** Sum of today's entries for this tracker, or 0 if none yet today. */
  todayCount: number;
  busy: boolean;
  onRecord: () => void;
}

export function CountRecorder({
  label,
  todayCount,
  busy,
  onRecord,
}: CountRecorderProps): ReactElement {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <span
        aria-live="polite"
        className="min-w-[1.5rem] text-center text-body font-semibold tabular-nums text-text-primary"
      >
        {todayCount}
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={onRecord}
        aria-label={`Log another ${label.toLowerCase()}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-h3 font-semibold text-action transition-colors hover:border-action focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60"
      >
        +
      </button>
    </div>
  );
}
