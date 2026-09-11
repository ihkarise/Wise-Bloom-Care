/**
 * AppShell — the public landing page (docs/04-Architecture/51 §4–§5). It is the
 * product's front door: it says what Wise Bloom Care is, gives a first visitor
 * the two ways in (create an account / log in), and states the calm, privacy-
 * first, educational-not-diagnostic posture the product is built on
 * (docs/00-Vision/03, docs/02-Research/28). It renders through the semantic
 * design tokens only (docs/03-UX/35 BR-1, 37 §5, 38 §4) — no new libraries, no
 * primitive colours — mounts no feature island and makes no network call. All
 * internal links resolve under the Pages base path via `withBase`
 * (docs/04-Architecture/51 §5).
 */
import type { ReactElement } from 'react';

import { withBase } from '../lib/paths';

/** Minimal on-brand bloom mark (inline SVG — no asset fetch). */
function BloomMark(): ReactElement {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-action"
      aria-hidden="true"
    >
      <path d="M12 21c0-4 0-7 0-9" />
      <path d="M12 12c-2.4 0-4.5-1.9-4.5-4.3C7.5 5.6 9.4 4 12 4s4.5 1.6 4.5 3.7C16.5 10.1 14.4 12 12 12Z" />
      <path d="M12 12c1.9 1.2 3 3.1 3 5.2M12 12c-1.9 1.2-3 3.1-3 5.2" />
    </svg>
  );
}

/** Small stroked glyph used on each feature card. */
function FeatureIcon({ paths }: { paths: string[] }): ReactElement {
  return (
    <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-raised text-action">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </span>
  );
}

const FEATURES: { title: string; body: string; paths: string[] }[] = [
  {
    title: 'Pregnancy, tracked calmly',
    body: 'Log blood pressure, weight and blood sugar and see gentle, non-diagnostic trends alongside your week-by-week timeline.',
    paths: ['M4 18V6', 'M4 18h16', 'M8 14l3-4 3 3 4-6'],
  },
  {
    title: 'Reports kept private',
    body: 'Add lab and ultrasound reports and open them through short-lived, private links — never a public URL, never shared by accident.',
    paths: ['M7 3h7l4 4v14H7z', 'M14 3v4h4', 'M9.5 13.5l1.8 1.8 3.2-3.6'],
  },
  {
    title: 'One record, for life',
    body: 'The mother’s pregnancy and the child’s growth are two views of a single family record — no reset, no duplicates.',
    paths: ['M9 7a3 3 0 116 0', 'M7 12h10', 'M8 12v4a2 2 0 002 2h4a2 2 0 002-2v-4'],
  },
];

const TRUST: string[] = [
  'Private by design',
  'Educational, never diagnostic',
  'Your record is yours',
];

export default function AppShell(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans text-text-primary">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <a
            href={withBase('/')}
            className="flex items-center gap-2 text-text-primary no-underline"
          >
            <BloomMark />
            <span className="text-small font-semibold uppercase tracking-[0.12em]">
              Wise Bloom Care
            </span>
          </a>
          <a
            href={withBase('/login')}
            className="rounded-md px-3 py-2 text-small font-medium text-text-primary no-underline transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Log in
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-14 pt-10 sm:pb-20 sm:pt-16">
          <div className="max-w-2xl">
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-action">
              Mother &amp; child health
            </p>
            <h1 className="mt-3 text-display font-semibold tracking-tight text-text-primary">
              One continuous record.
            </h1>
            <p className="mt-4 text-h3 font-normal leading-relaxed text-text-primary">
              The mother’s pregnancy timeline and the child’s growth timeline are two views of a
              single family record.
            </p>
            <p className="mt-3 text-body text-text-secondary">
              From conception through pregnancy, delivery and childhood — one journey, gently
              tracked and kept private. No reset, no duplicates.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={withBase('/register')}
                className="rounded-md bg-action px-5 py-3 text-center text-body font-medium text-white no-underline transition-colors hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Create your account
              </a>
              <a
                href={withBase('/login')}
                className="rounded-md border border-border bg-surface-raised px-5 py-3 text-center text-body font-medium text-text-primary no-underline transition-colors hover:border-action focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Log in
              </a>
            </div>

            <ul className="mt-8 flex list-none flex-wrap gap-2 pl-0">
              {TRUST.map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-border bg-surface-raised px-3 py-1 text-caption text-text-secondary"
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* What it does */}
        <section className="border-t border-border bg-surface-raised">
          <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-16">
            <h2 className="text-h2 font-semibold text-text-primary">What Wise Bloom Care does</h2>
            <p className="mt-2 max-w-2xl text-body text-text-secondary">
              A calm, private home for the whole journey — built to educate and organise your family
              health record, never to diagnose or replace your clinician.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-lg border border-border bg-surface p-5">
                  <FeatureIcon paths={feature.paths} />
                  <h3 className="text-h3 font-semibold text-text-primary">{feature.title}</h3>
                  <p className="mt-2 text-small leading-relaxed text-text-secondary">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust / privacy band */}
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-5xl px-6 py-14">
            <div className="max-w-2xl">
              <h2 className="text-h2 font-semibold text-text-primary">Private by design</h2>
              <p className="mt-2 text-body text-text-secondary">
                Your record is yours. Reports are served only through short-lived, backend-mediated
                links — there is no public URL. Wise Bloom Care provides educational information and
                helps you organise your health record; it is not a medical device and does not
                provide diagnosis or treatment. In an emergency, contact your local emergency
                services.
              </p>
              <div className="mt-7">
                <a
                  href={withBase('/register')}
                  className="inline-block rounded-md bg-action px-5 py-3 text-center text-body font-medium text-white no-underline transition-colors hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  Create your account
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-6 py-8 text-caption text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>© Wise Bloom Care</span>
          <span>
            care.wisehomeopathy.com · Educational information only — not a medical device.
          </span>
        </div>
      </footer>
    </div>
  );
}
