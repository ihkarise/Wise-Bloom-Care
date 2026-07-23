/**
 * DisclaimerGate — the global medical disclaimer, acknowledged at
 * registration (docs/02-Research/28 §6, BR-5). A content-type-aware
 * component in spirit: it renders the exact disclaimer text and requires an
 * explicit, accessible acknowledgement before the caller can proceed —
 * registration itself is rejected server-side without it (docs/04-Architecture/57
 * §4 step 3).
 */
import type { ReactElement } from 'react';

export interface DisclaimerGateProps {
  acknowledged: boolean;
  onChange: (acknowledged: boolean) => void;
}

const DISCLAIMER_TEXT =
  'Wise Bloom Care provides educational information and helps you organise your health record. ' +
  'It is not a medical device, does not provide medical advice, diagnosis, or treatment, and does ' +
  'not replace your clinician. Always seek the advice of a qualified health professional. In an ' +
  'emergency, contact your local emergency services immediately.';

export default function DisclaimerGate({
  acknowledged,
  onChange,
}: DisclaimerGateProps): ReactElement {
  return (
    <div className="rounded-md border border-border bg-surface-raised p-4">
      <p id="disclaimer-text" className="text-small text-text-secondary">
        {DISCLAIMER_TEXT}
      </p>
      <label className="mt-3 flex items-start gap-2 text-body text-text-primary">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => onChange(event.target.checked)}
          aria-describedby="disclaimer-text"
          className="mt-1 h-5 w-5 shrink-0 rounded border-border text-action focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
        <span>I have read and understood this disclaimer.</span>
      </label>
    </div>
  );
}
