/**
 * LoginIsland — session-issuing login (docs/04-Architecture/57 §5). A WCAG
 * 2.2 AA form (docs/03-UX/40); the error message is deliberately generic —
 * the backend never signals whether the email or the password was wrong
 * (57 BR-4, anti-enumeration), and this island simply surfaces that message
 * verbatim rather than trying to be more specific.
 */
import { useId, useState, type FormEvent, type ReactElement } from 'react';

import { login } from '../../api/auth';
import { ApiClient } from '../../api/client';
import { friendlyErrorMessage } from '../../lib/errors';
import { useSession } from '../../state/session';

export interface LoginIslandProps {
  apiBaseUrl: string;
}

export default function LoginIsland({ apiBaseUrl }: LoginIslandProps): ReactElement {
  const { setStored } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const client = new ApiClient({ baseUrl: apiBaseUrl });
      const result = await login(client, { email, password });
      setStored({ user: result.user, session: result.session });
      window.location.assign('/app');
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-body text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        aria-describedby={error ? errorId : undefined}
        className="rounded-md bg-action px-4 py-2 text-body font-medium text-white hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
      >
        {submitting ? 'Logging in…' : 'Log in'}
      </button>

      <p className="text-small text-text-secondary">
        New here?{' '}
        <a href="/register" className="text-link underline">
          Create an account
        </a>
        .
      </p>
    </form>
  );
}
