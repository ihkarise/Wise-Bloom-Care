import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

/**
 * Astro config (docs/04-Architecture/51, docs/ADR/ADR-003-Astro).
 * Islands architecture: React hydrates only interactive regions; Tailwind base
 * styles are disabled so the semantic design tokens in src/styles/tokens.css are
 * the single source of visual truth (docs/03-UX/35 §3).
 */
export default defineConfig({
  integrations: [react(), tailwind({ applyBaseStyles: false })],
});
