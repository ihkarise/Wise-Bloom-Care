/**
 * ScaleRecorder — a labelled 1..max segmented control for a `scale`-type
 * tracker (docs/03-UX/42 §7). Tapping a level appends a new `TrackerEntry`
 * (append-only — a re-tap of a different level is a fresh observation, not an
 * edit). `selected` highlights today's most recent recorded level, if any.
 */
import { type ReactElement } from 'react';

export interface ScaleRecorderProps {
  label: string;
  scaleMax: number;
  /** Today's most recently recorded level, or `null` if none yet today. */
  selected: number | null;
  busy: boolean;
  onRecord: (level: number) => void;
}

export function ScaleRecorder({
  label,
  scaleMax,
  selected,
  busy,
  onRecord,
}: ScaleRecorderProps): ReactElement {
  const levels = Array.from({ length: scaleMax }, (_, index) => index + 1);

  return (
    <div role="group" aria-label={`${label} level`} className="flex shrink-0 gap-1">
      {levels.map((level) => {
        const isSelected = level === selected;
        return (
          <button
            key={level}
            type="button"
            disabled={busy}
            aria-pressed={isSelected}
            onClick={() => onRecord(level)}
            className={`flex h-8 w-8 items-center justify-center rounded-md border text-small font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60 ${
              isSelected
                ? 'border-action bg-action text-white'
                : 'border-border bg-surface text-text-secondary hover:border-action hover:text-action'
            }`}
          >
            {level}
          </button>
        );
      })}
    </div>
  );
}
