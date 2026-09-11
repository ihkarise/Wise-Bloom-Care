/**
 * AppShell — the public landing island (docs/04-Architecture/51 §4, §5). It
 * renders through semantic tokens only (docs/03-UX/35 BR-1) and gives a first
 * visitor the two ways into the product: create an account or log in. All
 * internal links are built with `withBase` so they resolve under the GitHub
 * Pages base path (docs/04-Architecture/51 §5). It mounts no feature island and
 * makes no network call — later sprints deepen the landing, they do not depend
 * on it.
 */
import type { ReactElement } from 'react';

import { withBase } from '../lib/paths';

export interface AppShellProps {
  /** Environment label surfaced for the preview build (dev/staging/prod). */
  environment?: string;
}

export default function AppShell({ environment = 'dev' }: AppShellProps): ReactElement {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 bg-surface px-6 py-16 font-sans text-text-primary">
      <div className="flex flex-col gap-4">
        <p className="text-small font-medium uppercase tracking-wide text-text-secondary">
          Wise Bloom Care
        </p>
        <h1 className="text-display font-semibold">One continuous record.</h1>
        <p className="text-body text-text-secondary">
          The mother&rsquo;s pregnancy timeline and the child&rsquo;s growth timeline are two views
          of a single family record &mdash; one journey, no reset, no duplicates. Create your
          account to begin, or log in to continue.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={withBase('/register')}
          className="rounded-md bg-action px-5 py-2.5 text-center text-body font-medium text-white no-underline hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Create your account
        </a>
        <a
          href={withBase('/login')}
          className="rounded-md border border-border bg-surface-raised px-5 py-2.5 text-center text-body font-medium text-text-primary no-underline hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Log in
        </a>
      </div>

      <p className="text-caption uppercase tracking-wide text-text-secondary">
        Preview environment: <span className="font-medium text-action">{environment}</span>
      </p>
    </main>
  );
}
