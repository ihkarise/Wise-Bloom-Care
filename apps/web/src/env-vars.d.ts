/**
 * Public env var typing (docs/04-Architecture/60 §4). Kept separate from
 * `src/env.d.ts` — that file is Astro-generated and git-ignored, so any
 * augmentation added there would be lost on a clean checkout / `astro sync`.
 * Only `PUBLIC_`-prefixed vars are exposed to client code by Astro; that
 * prefix is the guarantee nothing sensitive lands here.
 */
interface ImportMetaEnv {
  readonly PUBLIC_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
