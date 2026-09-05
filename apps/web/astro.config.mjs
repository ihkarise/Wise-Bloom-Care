import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

/**
 * Astro config (docs/04-Architecture/51, docs/ADR/ADR-003-Astro).
 * Islands architecture: React hydrates only interactive regions; Tailwind base
 * styles are disabled so the semantic design tokens in src/styles/tokens.css are
 * the single source of visual truth (docs/03-UX/35 §3).
 *
 * `site` + `base` target the GitHub Pages project site
 * https://ihkarise.github.io/Wise-Bloom-Care/. Astro rewrites asset URLs for the
 * base automatically; hand-written internal routes go through `src/lib/paths.ts`
 * `withBase`. Override with PUBLIC_BASE_PATH for a different host (e.g. `/` or a
 * custom domain).
 */
export default defineConfig({
  site: process.env.PUBLIC_SITE_ORIGIN ?? 'https://ihkarise.github.io',
  base: process.env.PUBLIC_BASE_PATH ?? '/Wise-Bloom-Care/',
  integrations: [react(), tailwind({ applyBaseStyles: false })],
});
