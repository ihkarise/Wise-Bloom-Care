/**
 * TextRecorder — a single-line note for a `text`-type tracker (docs/03-UX/42
 * §7). Deliberately one field, no multi-field composition — this is not a
 * form builder (docs/06-Modules/98 §5, BR-5). Submitting appends a new
 * `TrackerEntry` and clears the input so another note can be added the same
 * day (multiple notes in a day are valid, append-only).
 */
import { useId, useState, type FormEvent, type ReactElement } from 'react';

const TEXT_MAX_LENGTH = 200;

const inputClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-small text-text-primary placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

export interface TextRecorderProps {
  label: string;
  busy: boolean;
  onRecord: (text: string) => void;
}

export function TextRecorder({ label, busy, onRecord }: TextRecorderProps): ReactElement {
  const [text, setText] = useState('');
  const inputId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = text.trim();
    if (busy || trimmed.length === 0) {
      return;
    }
    onRecord(trimmed);
    setText('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2 sm:w-auto">
      <label htmlFor={inputId} className="sr-only">
        {label} note
      </label>
      <input
        id={inputId}
        type="text"
        value={text}
        maxLength={TEXT_MAX_LENGTH}
        placeholder="Add a note"
        onChange={(event) => setText(event.target.value)}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={busy || text.trim().length === 0}
        className="inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-small font-medium text-action transition-colors hover:border-action focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60"
      >
        Add
      </button>
    </form>
  );
}
