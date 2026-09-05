/**
 * Base-path-aware internal navigation (docs/04-Architecture/51 §5).
 *
 * The site is served under an Astro `base` (`/Wise-Bloom-Care/` on GitHub
 * Pages, `/` in local dev/tests). Astro rewrites asset URLs automatically, but
 * NOT hand-written route strings, so every internal navigation and link must be
 * built through `withBase` rather than using a root-absolute path like
 * `/login`, which would resolve to the domain root and 404 under a base.
 *
 * `import.meta.env.BASE_URL` is replaced at build time with the configured base
 * (always ending in `/`).
 */

const BASE_URL: string =
  typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/';

/** Prefixes an app-internal path with the configured base, avoiding a double slash. */
export function withBase(path: string): string {
  const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}
