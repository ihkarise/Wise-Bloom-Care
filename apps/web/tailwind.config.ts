import type { Config } from 'tailwindcss';

/**
 * Tailwind theme bound to **semantic** design tokens only (docs/03-UX/35 BR-1,
 * 37 §5, 38 §4). Utilities resolve to CSS custom properties defined in
 * src/styles/tokens.css, so themes and accessibility fixes change in one place.
 * Components never reference primitive colours directly.
 */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised: 'var(--color-surface-raised)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
        },
        action: {
          DEFAULT: 'var(--color-action)',
          hover: 'var(--color-action-hover)',
        },
        link: 'var(--color-link)',
        positive: 'var(--color-positive)',
        caution: 'var(--color-caution)',
        'alert-emergency': 'var(--color-alert-emergency)',
        focus: 'var(--color-focus)',
        border: 'var(--color-border)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
      },
      fontSize: {
        display: ['var(--text-display-size)', { lineHeight: 'var(--text-display-lh)' }],
        h1: ['var(--text-h1-size)', { lineHeight: 'var(--text-h1-lh)' }],
        h2: ['var(--text-h2-size)', { lineHeight: 'var(--text-h2-lh)' }],
        h3: ['var(--text-h3-size)', { lineHeight: 'var(--text-h3-lh)' }],
        body: ['var(--text-body-size)', { lineHeight: 'var(--text-body-lh)' }],
        small: ['var(--text-small-size)', { lineHeight: 'var(--text-small-lh)' }],
        caption: ['var(--text-caption-size)', { lineHeight: 'var(--text-caption-lh)' }],
      },
    },
  },
  plugins: [],
} satisfies Config;
