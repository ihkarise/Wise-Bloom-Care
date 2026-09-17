/**
 * BooleanRecorder — a single switch for a `boolean`-type tracker (docs/03-UX/42
 * §7). Tapping records the new state as a fresh `TrackerEntry` (`"true"` or
 * `"false"`) — a boolean tracker typically reflects "yes, at least once
 * today" (docs/06-Modules/98 §16 edge cases), but recording an explicit "no"
 * is equally valid, since it is a genuine observation, not a checkbox.
 */
import { type ReactElement } from 'react';

export interface BooleanRecorderProps {
  label: string;
  /** Today's most recently recorded value, or `null` if none yet today. */
  value: boolean | null;
  busy: boolean;
  onRecord: (value: boolean) => void;
}

export function BooleanRecorder({
  label,
  value,
  busy,
  onRecord,
}: BooleanRecorderProps): ReactElement {
  const isOn = value === true;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={label}
      disabled={busy}
      onClick={() => onRecord(!isOn)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60 ${
        isOn ? 'border-action bg-action' : 'border-border bg-surface'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          isOn ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
