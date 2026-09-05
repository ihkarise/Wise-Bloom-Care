/**
 * RegisterIsland — registration with disclaimer acknowledgement
 * (docs/04-Architecture/57 §4, docs/20-Implementation/206 objective 7). A
 * WCAG 2.2 AA form (docs/03-UX/40): labelled fields, inline+summary errors,
 * visible focus, no meaning by colour alone. All network access goes through
 * `api/auth.ts` (docs/04-Architecture/51 BR-1).
 */
import { useId, useState, type FormEvent, type ReactElement } from 'react';

import { register } from '../../api/auth';
import { ApiClient } from '../../api/client';
import { friendlyErrorMessage } from '../../lib/errors';
import { withBase } from '../../lib/paths';
import { useSession } from '../../state/session';
import DisclaimerGate from './DisclaimerGate';

export interface RegisterIslandProps {
  apiBaseUrl: string;
}

export default function RegisterIsland({ apiBaseUrl }: RegisterIslandProps): ReactElement {
  const { setStored } = useSession();
  const [maternalName, setMaternalName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [disclaimerAck, setDisclaimerAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!disclaimerAck) {
      setError('Please confirm you have read and understood the disclaimer to continue.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const client = new ApiClient({ baseUrl: apiBaseUrl });
      const result = await register(client, {
        email,
        password,
        disclaimer_ack: true,
        maternal_name: maternalName,
      });
      setStored({ user: result.user, session: result.session });
      window.location.assign(withBase('/app'));
    } catch (caught) {
      setError(friendlyErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      noValidate
      className="flex flex-col gap-4"
    >
      {error ? (
        <p
          role="alert"
          id={errorId}
          className="rounded-md border border-caution bg-surface-raised p-3 text-small text-text-primary"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor={nameId} className="text-small font-medium text-text-primary">
          Your name
        </label>
        <input
          id={nameId}
          name="maternal_name"
          type="text"
          autoComplete="name"
          required
          value={maternalName}
          onChange={(event) => setMaternalName(event.target.value)}
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-body text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={emailId} className="text-small font-medium text-text-primary">
          Email
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-body text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={passwordId} className="text-small font-medium text-text-primary">
          Password
        </label>
        <input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-body text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
        <span className="text-caption text-text-secondary">At least 8 characters.</span>
      </div>

      <DisclaimerGate acknowledged={disclaimerAck} onChange={setDisclaimerAck} />

      <button
        type="submit"
        disabled={submitting}
        aria-describedby={error ? errorId : undefined}
        className="rounded-md bg-action px-4 py-2 text-body font-medium text-white hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
      >
        {submitting ? 'Creating your account…' : 'Create account'}
      </button>

      <p className="text-small text-text-secondary">
        Already have an account?{' '}
        <a href={withBase('/login')} className="text-link underline">
          Log in
        </a>
        .
      </p>
    </form>
  );
}
