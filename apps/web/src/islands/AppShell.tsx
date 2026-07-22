/**
 * AppShell — the Sprint 00 empty-but-wired shell, rendered as a hydrated React
 * island (docs/04-Architecture/51 §4). It ships no product feature: it exists to
 * prove the Astro + React + Tailwind + design-token pipeline boots and renders
 * through semantic tokens only (docs/03-UX/35 BR-1). Later sprints mount real
 * feature islands here.
 */
import type { ReactElement } from 'react';

export interface AppShellProps {
  /** Environment label surfaced for the foundation build (dev/staging/prod). */
  environment?: string;
}

export default function AppShell({ environment = 'dev' }: AppShellProps): ReactElement {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 bg-surface px-6 py-16 font-sans text-text-primary">
      <p className="text-small font-medium uppercase tracking-wide text-text-secondary">
        Wise Bloom Care
      </p>
      <h1 className="text-display font-semibold">One continuous record.</h1>
      <p className="text-body text-text-secondary">
        The mother&rsquo;s pregnancy timeline and the child&rsquo;s growth timeline are two views of
        a single family record. This is the Sprint 00 foundation shell &mdash; wired, themed, and
        ready for features.
      </p>
      <div className="rounded-md border border-border bg-surface-raised p-4">
        <p className="text-caption uppercase tracking-wide text-text-secondary">Build baseline</p>
        <p className="text-body">
          Environment: <span className="font-medium text-action">{environment}</span>
        </p>
      </div>
    </main>
  );
}
